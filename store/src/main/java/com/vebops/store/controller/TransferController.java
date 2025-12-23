package com.vebops.store.controller;

import com.vebops.store.dto.TransferLineDto;
import com.vebops.store.dto.TransferRecordDto;
import com.vebops.store.model.AccessType;
import com.vebops.store.model.Project;
import com.vebops.store.model.TransferLine;
import com.vebops.store.model.TransferRecord;
import com.vebops.store.model.UserAccount;
import com.vebops.store.repository.TransferRecordRepository;
import com.vebops.store.service.AuthService;
import com.vebops.store.util.AuthUtils;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.util.StringUtils;

/**
 * Controller for transfer record operations.
 * Provides endpoints to get transfer records with details.
 */
@RestController
@RequestMapping("/api/transfers")
public class TransferController {

    private final AuthService authService;
    private final TransferRecordRepository transferRecordRepository;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    public TransferController(
        AuthService authService,
        TransferRecordRepository transferRecordRepository
    ) {
        this.authService = authService;
        this.transferRecordRepository = transferRecordRepository;
    }

    /**
     * Get a single transfer record by ID with all lines.
     * Only accessible to users who have access to either the from or to project.
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getTransferById(
        @PathVariable Long id,
        @RequestParam(name = "search", required = false) String search
    ) {
        Long userId = AuthUtils.requireUserId();
        UserAccount user = authService.getUserById(userId);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Unauthorized"));
        }

        TransferRecord record = transferRecordRepository.findWithLinesById(id).orElse(null);
        if (record == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Transfer record not found"));
        }

        // Check access - user must have access to either fromProject or toProject
        if (user.getAccessType() == AccessType.PROJECTS) {
            Long fromProjectId = record.getFromProject() != null ? record.getFromProject().getId() : null;
            Long toProjectId = record.getToProject() != null ? record.getToProject().getId() : null;
            Set<Long> allowedProjectIds = user.getProjects().stream()
                .map(Project::getId)
                .collect(Collectors.toSet());
            
            boolean hasAccess = (fromProjectId != null && allowedProjectIds.contains(fromProjectId)) ||
                               (toProjectId != null && allowedProjectIds.contains(toProjectId));
            
            if (!hasAccess) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied to this transfer record"));
            }
        }

        // Convert to DTO
        TransferRecordDto dto = convertToDto(record, filterLines(record.getLines(), search));
        return ResponseEntity.ok(dto);
    }

    private TransferRecordDto convertToDto(TransferRecord record, List<TransferLine> lines) {
        List<TransferLineDto> lineDtos = lines.stream()
            .map(this::convertLineToDto)
            .toList();

        return new TransferRecordDto(
            record.getId() != null ? record.getId().toString() : null,
            record.getCode(),
            record.getFromProject() != null ? record.getFromProject().getId().toString() : null,
            record.getFromProject() != null ? record.getFromProject().getName() : null,
            record.getFromSite(),
            record.getToProject() != null ? record.getToProject().getId().toString() : null,
            record.getToProject() != null ? record.getToProject().getName() : null,
            record.getToSite(),
            record.getTransferDate() != null ? DATE_FMT.format(record.getTransferDate()) : null,
            record.getRemarks(),
            lineDtos,
            lineDtos.size()
        );
    }

    private TransferLineDto convertLineToDto(TransferLine line) {
        return new TransferLineDto(
            line.getId() != null ? line.getId().toString() : null,
            line.getMaterial() != null ? line.getMaterial().getId().toString() : null,
            line.getMaterial() != null ? line.getMaterial().getCode() : null,
            line.getMaterial() != null ? line.getMaterial().getName() : null,
            line.getMaterial() != null ? line.getMaterial().getUnit() : null,
            line.getTransferQty()
        );
    }

    private List<TransferLine> filterLines(List<TransferLine> lines, String search) {
        if (lines == null || !StringUtils.hasText(search)) {
            return lines;
        }
        String term = search.trim().toLowerCase();
        return lines.stream()
            .filter(line -> line.getMaterial() != null && (
                (line.getMaterial().getCode() != null && line.getMaterial().getCode().toLowerCase().contains(term)) ||
                (line.getMaterial().getName() != null && line.getMaterial().getName().toLowerCase().contains(term))
            ))
            .toList();
    }
}
