package com.vebops.store.controller;

import com.vebops.store.dto.OutwardLineDto;
import com.vebops.store.dto.OutwardRegisterDto;
import com.vebops.store.model.AccessType;
import com.vebops.store.model.Material;
import com.vebops.store.model.OutwardLine;
import com.vebops.store.model.OutwardRecord;
import com.vebops.store.model.OutwardStatus;
import com.vebops.store.model.Project;
import com.vebops.store.model.UserAccount;
import com.vebops.store.repository.MaterialRepository;
import com.vebops.store.repository.OutwardRecordRepository;
import com.vebops.store.service.AuthService;
import com.vebops.store.util.AuthUtils;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for outward record CRUD operations.
 * Provides endpoints to get, update, and validate outward records.
 */
@RestController
@RequestMapping("/api/outwards")
public class OutwardController {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final AuthService authService;
    private final OutwardRecordRepository outwardRecordRepository;
    private final MaterialRepository materialRepository;

    public OutwardController(
        AuthService authService,
        OutwardRecordRepository outwardRecordRepository,
        MaterialRepository materialRepository
    ) {
        this.authService = authService;
        this.outwardRecordRepository = outwardRecordRepository;
        this.materialRepository = materialRepository;
    }

    /**
     * Get a single outward record by ID with all lines.
     * Only accessible to users who have access to the record's project.
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getOutwardById(@PathVariable Long id) {
        Long userId = AuthUtils.requireUserId();
        UserAccount user = authService.getUserById(userId);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Unauthorized"));
        }

        OutwardRecord record = outwardRecordRepository.findWithLinesById(id).orElse(null);
        if (record == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Outward record not found"));
        }

        // Check access
        if (user.getAccessType() == AccessType.PROJECTS) {
            Long projectId = record.getProject() != null ? record.getProject().getId() : null;
            Set<Long> allowedProjectIds = user.getProjects().stream()
                .map(Project::getId)
                .collect(Collectors.toSet());
            if (projectId == null || !allowedProjectIds.contains(projectId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied to this project"));
            }
        }

        // Convert to DTO
        OutwardRegisterDto dto = convertToDto(record);
        return ResponseEntity.ok(dto);
    }

    /**
     * Update quantities for outward lines.
     * Only allowed if the record is not validated.
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateOutward(
        @PathVariable Long id,
        @RequestBody UpdateOutwardRequest request
    ) {
        Long userId = AuthUtils.requireUserId();
        UserAccount user = authService.getUserById(userId);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Unauthorized"));
        }

        OutwardRecord record = outwardRecordRepository.findWithLinesById(id).orElse(null);
        if (record == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Outward record not found"));
        }

        // Check access
        if (user.getAccessType() == AccessType.PROJECTS) {
            Long projectId = record.getProject() != null ? record.getProject().getId() : null;
            Set<Long> allowedProjectIds = user.getProjects().stream()
                .map(Project::getId)
                .collect(Collectors.toSet());
            if (projectId == null || !allowedProjectIds.contains(projectId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied to this project"));
            }
        }

        // Check if validated
        if (record.isValidated()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Cannot update validated record"));
        }

        // Update lines
        if (request.getLines() != null) {
            for (UpdateLineRequest lineUpdate : request.getLines()) {
                OutwardLine line = record.getLines().stream()
                    .filter(l -> l.getId().equals(lineUpdate.getId()))
                    .findFirst()
                    .orElse(null);
                
                if (line != null && lineUpdate.getIssueQty() != null) {
                    line.setIssueQty(lineUpdate.getIssueQty());
                }
            }
        }

        OutwardRecord saved = outwardRecordRepository.save(record);
        OutwardRegisterDto dto = convertToDto(saved);
        return ResponseEntity.ok(dto);
    }

    /**
     * Mark an outward record as validated.
     * Once validated, the record cannot be edited.
     */
    @PostMapping("/{id}/validate")
    public ResponseEntity<?> validateOutward(@PathVariable Long id) {
        Long userId = AuthUtils.requireUserId();
        UserAccount user = authService.getUserById(userId);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Unauthorized"));
        }

        OutwardRecord record = outwardRecordRepository.findWithLinesById(id).orElse(null);
        if (record == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Outward record not found"));
        }

        // Check access
        if (user.getAccessType() == AccessType.PROJECTS) {
            Long projectId = record.getProject() != null ? record.getProject().getId() : null;
            Set<Long> allowedProjectIds = user.getProjects().stream()
                .map(Project::getId)
                .collect(Collectors.toSet());
            if (projectId == null || !allowedProjectIds.contains(projectId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied to this project"));
            }
        }

        if (record.isValidated()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Record already validated"));
        }

        record.setValidated(true);
        OutwardRecord saved = outwardRecordRepository.save(record);
        OutwardRegisterDto dto = convertToDto(saved);
        return ResponseEntity.ok(dto);
    }

    /**
     * Close an outward record.
     * Sets the status to CLOSED and records the close date.
     */
    @PostMapping("/{id}/close")
    public ResponseEntity<?> closeOutward(@PathVariable Long id) {
        Long userId = AuthUtils.requireUserId();
        UserAccount user = authService.getUserById(userId);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Unauthorized"));
        }

        OutwardRecord record = outwardRecordRepository.findWithLinesById(id).orElse(null);
        if (record == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Outward record not found"));
        }

        // Check access
        if (user.getAccessType() == AccessType.PROJECTS) {
            Long projectId = record.getProject() != null ? record.getProject().getId() : null;
            Set<Long> allowedProjectIds = user.getProjects().stream()
                .map(Project::getId)
                .collect(Collectors.toSet());
            if (projectId == null || !allowedProjectIds.contains(projectId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied to this project"));
            }
        }

        if (record.getStatus() == OutwardStatus.CLOSED) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Outward already closed"));
        }

        record.setStatus(OutwardStatus.CLOSED);
        record.setCloseDate(java.time.LocalDate.now());
        OutwardRecord saved = outwardRecordRepository.save(record);
        OutwardRegisterDto dto = convertToDto(saved);
        return ResponseEntity.ok(dto);
    }

    private OutwardRegisterDto convertToDto(OutwardRecord record) {
        List<OutwardLineDto> lines = new ArrayList<>();
        for (OutwardLine line : record.getLines()) {
            Material material = line.getMaterial();
            lines.add(new OutwardLineDto(
                line.getId() != null ? String.valueOf(line.getId()) : null,
                material != null && material.getId() != null ? String.valueOf(material.getId()) : null,
                material != null ? material.getCode() : null,
                material != null ? material.getName() : null,
                material != null ? material.getUnit() : null,
                line.getIssueQty()
            ));
        }

        Project project = record.getProject();
        return new OutwardRegisterDto(
            record.getId() != null ? String.valueOf(record.getId()) : null,
            project != null && project.getId() != null ? String.valueOf(project.getId()) : null,
            project != null ? project.getName() : null,
            record.getCode(),
            record.getDate() != null ? DATE_FMT.format(record.getDate()) : null,
            record.getIssueTo(),
            record.getStatus() != null ? record.getStatus().name() : null,
            record.getCloseDate() != null ? DATE_FMT.format(record.getCloseDate()) : null,
            record.isValidated(),
            lines.size(),
            lines
        );
    }

    /**
     * Request body for updating outward record.
     */
    public static class UpdateOutwardRequest {
        private List<UpdateLineRequest> lines;

        public List<UpdateLineRequest> getLines() {
            return lines;
        }

        public void setLines(List<UpdateLineRequest> lines) {
            this.lines = lines;
        }
    }

    /**
     * Request body for updating a single outward line.
     */
    public static class UpdateLineRequest {
        private Long id;
        private Double issueQty;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public Double getIssueQty() {
            return issueQty;
        }

        public void setIssueQty(Double issueQty) {
            this.issueQty = issueQty;
        }
    }
}
