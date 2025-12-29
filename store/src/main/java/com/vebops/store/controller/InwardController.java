package com.vebops.store.controller;

import com.vebops.store.dto.InwardLineDto;
import com.vebops.store.dto.InwardRecordDto;
import com.vebops.store.model.InwardLine;
import com.vebops.store.model.InwardRecord;
import com.vebops.store.model.Material;
import com.vebops.store.model.UserAccount;
import com.vebops.store.repository.InwardRecordRepository;
import com.vebops.store.repository.MaterialRepository;
import com.vebops.store.service.AuthService;
import com.vebops.store.service.AppDataService;
import com.vebops.store.util.AuthUtils;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for inward record CRUD operations.
 * Provides endpoints to get, update, and validate inward records.
 */
@RestController
@RequestMapping("/api/inwards")
public class InwardController {

    private final AuthService authService;
    private final InwardRecordRepository inwardRecordRepository;
    private final MaterialRepository materialRepository;
    private final AppDataService appDataService;

    public InwardController(
            AuthService authService,
            InwardRecordRepository inwardRecordRepository,
            MaterialRepository materialRepository,
            AppDataService appDataService) {
        this.authService = authService;
        this.inwardRecordRepository = inwardRecordRepository;
        this.materialRepository = materialRepository;
        this.appDataService = appDataService;
    }

    /**
     * Get a single inward record by ID with all lines.
     * Only accessible to users who have access to the record's project.
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getInwardById(
            @PathVariable Long id,
            @RequestParam(name = "search", required = false) String search) {
        Long userId = AuthUtils.requireUserId();
        UserAccount user = authService.getUserById(userId);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized"));
        }

        InwardRecord record = inwardRecordRepository.findWithLinesById(id).orElse(null);
        if (record == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Inward record not found"));
        }

        // Check access
        // Check access
        Long projectId = record.getProject() != null ? record.getProject().getId() : null;
        if (!appDataService.hasProjectAccess(user, projectId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied to this project"));
        }

        // Convert to DTO
        InwardRecordDto dto = convertToDto(record, filterLines(record.getLines(), search));
        return ResponseEntity.ok(dto);
    }

    /**
     * Update quantities for inward lines.
     * Only allowed if the record is not validated.
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateInward(
            @PathVariable Long id,
            @RequestBody UpdateInwardRequest request) {
        Long userId = AuthUtils.requireUserId();
        UserAccount user = authService.getUserById(userId);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized"));
        }

        InwardRecord record = inwardRecordRepository.findById(id).orElse(null);
        if (record == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Inward record not found"));
        }

        // Check access
        // Check access
        Long projectId = record.getProject() != null ? record.getProject().getId() : null;
        if (!appDataService.hasProjectAccess(user, projectId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied to this project"));
        }

        // Check if validated
        if (record.isValidated()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Cannot update validated record"));
        }

        // Update lines
        if (request.getLines() != null) {
            for (UpdateLineRequest lineUpdate : request.getLines()) {
                InwardLine line = record.getLines().stream()
                        .filter(l -> l.getId().equals(lineUpdate.getId()))
                        .findFirst()
                        .orElse(null);

                if (line != null) {
                    if (lineUpdate.getOrderedQty() != null) {
                        line.setOrderedQty(lineUpdate.getOrderedQty());
                    }
                    if (lineUpdate.getReceivedQty() != null) {
                        line.setReceivedQty(lineUpdate.getReceivedQty());
                    }
                }
            }
        }

        InwardRecord saved = inwardRecordRepository.save(record);
        InwardRecordDto dto = convertToDto(saved, saved.getLines());
        return ResponseEntity.ok(dto);
    }

    /**
     * Mark an inward record as validated.
     * Once validated, the record cannot be edited.
     */
    @PostMapping("/{id}/validate")
    public ResponseEntity<?> validateInward(@PathVariable Long id) {
        Long userId = AuthUtils.requireUserId();
        UserAccount user = authService.getUserById(userId);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized"));
        }

        InwardRecord record = inwardRecordRepository.findById(id).orElse(null);
        if (record == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Inward record not found"));
        }

        // Check access
        // Check access
        Long projectId = record.getProject() != null ? record.getProject().getId() : null;
        if (!appDataService.hasProjectAccess(user, projectId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied to this project"));
        }

        if (record.isValidated()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Record already validated"));
        }

        record.setValidated(true);
        InwardRecord saved = inwardRecordRepository.save(record);
        InwardRecordDto dto = convertToDto(saved, saved.getLines());
        return ResponseEntity.ok(dto);
    }

    private InwardRecordDto convertToDto(InwardRecord record, List<InwardLine> lines) {
        InwardRecordDto dto = new InwardRecordDto();
        dto.setId(record.getId());
        dto.setCode(record.getCode());
        dto.setProjectName(record.getProject() != null ? record.getProject().getName() : null);
        dto.setType(record.getType() != null ? record.getType().name() : null);
        dto.setInvoiceNo(record.getInvoiceNo());
        dto.setInvoiceDate(record.getInvoiceDate());
        dto.setDeliveryDate(record.getDeliveryDate());
        dto.setVehicleNo(record.getVehicleNo());
        dto.setRemarks(record.getRemarks());
        dto.setSupplierName(record.getSupplierName());
        dto.setEntryDate(record.getEntryDate());
        dto.setValidated(record.isValidated());

        List<InwardLineDto> lineDtos = lines.stream()
                .map(line -> {
                    InwardLineDto lineDto = new InwardLineDto();
                    lineDto.setId(line.getId());
                    Material material = line.getMaterial();
                    if (material != null) {
                        lineDto.setMaterialId(material.getId());
                        lineDto.setMaterialCode(material.getCode());
                        lineDto.setMaterialName(material.getName());
                        lineDto.setUnit(material.getUnit());
                    }
                    lineDto.setOrderedQty(line.getOrderedQty());
                    lineDto.setReceivedQty(line.getReceivedQty());
                    return lineDto;
                })
                .collect(Collectors.toList());

        dto.setLines(lineDtos);
        return dto;
    }

    private List<InwardLine> filterLines(List<InwardLine> lines, String search) {
        if (lines == null || !StringUtils.hasText(search)) {
            return lines;
        }
        String term = search.trim().toLowerCase();
        return lines.stream()
                .filter(line -> {
                    Material material = line.getMaterial();
                    if (material == null) {
                        return false;
                    }
                    return (material.getCode() != null && material.getCode().toLowerCase().contains(term)) ||
                            (material.getName() != null && material.getName().toLowerCase().contains(term));
                })
                .toList();
    }

    /**
     * Request body for updating inward record.
     */
    public static class UpdateInwardRequest {
        private List<UpdateLineRequest> lines;

        public List<UpdateLineRequest> getLines() {
            return lines;
        }

        public void setLines(List<UpdateLineRequest> lines) {
            this.lines = lines;
        }
    }

    /**
     * Request body for updating a single line.
     */
    public static class UpdateLineRequest {
        private Long id;
        private Double orderedQty;
        private Double receivedQty;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public Double getOrderedQty() {
            return orderedQty;
        }

        public void setOrderedQty(Double orderedQty) {
            this.orderedQty = orderedQty;
        }

        public Double getReceivedQty() {
            return receivedQty;
        }

        public void setReceivedQty(Double receivedQty) {
            this.receivedQty = receivedQty;
        }
    }
}
