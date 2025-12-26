package com.vebops.store.controller;

import com.vebops.store.dto.InwardHistoryDto;
import com.vebops.store.dto.OutwardRegisterDto;
import com.vebops.store.dto.PaginatedResponse;
import com.vebops.store.dto.TransferRecordDto;
import com.vebops.store.dto.InwardLineDto;
import com.vebops.store.dto.OutwardLineDto;
import com.vebops.store.dto.TransferLineDto;
import com.vebops.store.model.AccessType;
import com.vebops.store.model.InwardLine;
import com.vebops.store.model.InwardRecord;
import com.vebops.store.model.Material;
import com.vebops.store.model.OutwardLine;
import com.vebops.store.model.OutwardRecord;
import com.vebops.store.model.Project;
import com.vebops.store.model.TransferLine;
import com.vebops.store.model.TransferRecord;
import com.vebops.store.model.UserAccount;
import com.vebops.store.repository.InwardRecordRepository;
import com.vebops.store.repository.OutwardRecordRepository;
import com.vebops.store.repository.ProjectRepository;
import com.vebops.store.repository.TransferRecordRepository;
import com.vebops.store.service.AuthService;
import com.vebops.store.util.AuthUtils;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller providing paginated history endpoints for inwards, outwards and
 * transfers.
 *
 * These endpoints move pagination and filtering logic from the frontend to the
 * backend.
 * They accept optional page/size parameters and will automatically clamp values
 * to
 * sensible ranges. Only records from projects that the current user has access
 * to
 * (based on their AccessType and assigned projects) are returned.
 */
@RestController
@RequestMapping("/api/history")
public class HistoryController {

    private final AuthService authService;
    private final ProjectRepository projectRepository;
    private final InwardRecordRepository inwardRecordRepository;
    private final OutwardRecordRepository outwardRecordRepository;
    private final TransferRecordRepository transferRecordRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    public HistoryController(
            AuthService authService,
            ProjectRepository projectRepository,
            InwardRecordRepository inwardRecordRepository,
            OutwardRecordRepository outwardRecordRepository,
            TransferRecordRepository transferRecordRepository) {
        this.authService = authService;
        this.projectRepository = projectRepository;
        this.inwardRecordRepository = inwardRecordRepository;
        this.outwardRecordRepository = outwardRecordRepository;
        this.transferRecordRepository = transferRecordRepository;
    }

    /**
     * Returns paginated inward record history for the current user with advanced
     * filtering.
     * Records are ordered by entry date descending.
     *
     * @param page         1‑based page number (defaults to 1 if invalid)
     * @param size         maximum number of items per page (capped between 1 and
     *                     100, defaults to 10)
     * @param projectId    filter by project ID
     * @param supplierName filter by supplier name (contains search)
     * @param invoiceNo    filter by invoice number (contains search)
     * @param startDate    filter records from this date (ISO format: YYYY-MM-DD)
     * @param endDate      filter records until this date (ISO format: YYYY-MM-DD)
     * @return a paginated response containing inward record DTOs
     */
    @GetMapping("/inwards")
    public PaginatedResponse<InwardHistoryDto> getInwards(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "projectId", required = false) Long projectId,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "supplierName", required = false) String supplierName,
            @RequestParam(name = "invoiceNo", required = false) String invoiceNo,
            @RequestParam(name = "startDate", required = false) String startDate,
            @RequestParam(name = "endDate", required = false) String endDate) {
        Long userId = AuthUtils.requireUserId();
        UserAccount user = authService.getUserById(userId);
        Set<Long> allowedProjectIds = resolveAllowedProjectIds(user);
        int safePage = sanitizePage(page);
        int safeSize = sanitizeSize(size);

        // If projectId is specified, filter to only that project (if user has access)
        if (projectId != null) {
            if (!allowedProjectIds.contains(projectId)) {
                return emptyResponse(safePage, safeSize);
            }
            allowedProjectIds = Collections.singleton(projectId);
        }

        if (allowedProjectIds.isEmpty()) {
            return emptyResponse(safePage, safeSize);
        }

        // Parse filter dates
        final LocalDate startLocalDate = parseDateOrNull(startDate);
        final LocalDate endLocalDate = parseDateOrNull(endDate);
        final Set<Long> scopedProjectIds = allowedProjectIds;

        List<InwardHistoryDto> dtos = inwardRecordRepository
                .findAllByOrderByEntryDateDesc()
                .stream()
                .filter(record -> record.getProject() != null && scopedProjectIds.contains(record.getProject().getId()))
                .filter(record -> filterInward(record, supplierName, invoiceNo, startLocalDate, endLocalDate))
                .filter(record -> search == null || search.trim().isEmpty() || matchesInwardSearch(record, search))
                .map(this::toInwardRecordDto)
                .toList();

        return toPaginatedResponse(buildPageFromList(dtos, safePage, safeSize));
    }

    /**
     * Returns paginated outward register history for the current user with advanced
     * filtering.
     * Records are ordered by register date descending.
     *
     * @param page      1‑based page number (defaults to 1 if invalid)
     * @param size      maximum number of items per page (capped between 1 and 100,
     *                  defaults to 10)
     * @param projectId filter by project ID
     * @param issueTo   filter by issue-to (contains search)
     * @param jobNo     filter by job number (contains search)
     * @param startDate filter records from this date (ISO format: YYYY-MM-DD)
     * @param endDate   filter records until this date (ISO format: YYYY-MM-DD)
     * @return a paginated response containing outward register DTOs
     */
    @GetMapping("/outwards")
    public PaginatedResponse<OutwardRegisterDto> getOutwards(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "projectId", required = false) Long projectId,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "issueTo", required = false) String issueTo,
            @RequestParam(name = "jobNo", required = false) String jobNo,
            @RequestParam(name = "startDate", required = false) String startDate,
            @RequestParam(name = "endDate", required = false) String endDate) {
        Long userId = AuthUtils.requireUserId();
        UserAccount user = authService.getUserById(userId);
        Set<Long> allowedProjectIds = resolveAllowedProjectIds(user);
        int safePage = sanitizePage(page);
        int safeSize = sanitizeSize(size);

        // If projectId is specified, filter to only that project (if user has access)
        if (projectId != null) {
            if (!allowedProjectIds.contains(projectId)) {
                // User doesn't have access to this project
                return emptyResponse(safePage, safeSize);
            }
            allowedProjectIds = Collections.singleton(projectId);
        }

        if (allowedProjectIds.isEmpty()) {
            return emptyResponse(safePage, safeSize);
        }
        // Parse filter dates
        final LocalDate startLocalDate = parseDateOrNull(startDate);
        final LocalDate endLocalDate = parseDateOrNull(endDate);
        final Set<Long> scopedProjectIds = allowedProjectIds;

        List<OutwardRegisterDto> dtos = outwardRecordRepository
                .findAllByOrderByEntryDateDesc()
                .stream()
                .filter(record -> record.getProject() != null && scopedProjectIds.contains(record.getProject().getId()))
                .filter(record -> filterOutward(record, issueTo, jobNo, startLocalDate, endLocalDate))
                .filter(record -> search == null || search.trim().isEmpty() || matchesOutwardSearch(record, search))
                .map(this::toOutwardRegisterDto)
                .toList();

        return toPaginatedResponse(buildPageFromList(dtos, safePage, safeSize));
    }

    /**
     * Returns paginated transfer record history for the current user with advanced
     * filtering.
     * Records are ordered by transfer date descending.
     *
     * @param page        1‑based page number (defaults to 1 if invalid)
     * @param size        maximum number of items per page (capped between 1 and
     *                    100, defaults to 10)
     * @param projectId   filter by project ID
     * @param fromProject filter by from-project (contains search)
     * @param toProject   filter by to-project (contains search)
     * @param startDate   filter records from this date (ISO format: YYYY-MM-DD)
     * @param endDate     filter records until this date (ISO format: YYYY-MM-DD)
     * @return a paginated response containing transfer record DTOs
     */
    @GetMapping("/transfers")
    public PaginatedResponse<TransferRecordDto> getTransfers(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "projectId", required = false) Long projectId,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "fromProject", required = false) String fromProject,
            @RequestParam(name = "toProject", required = false) String toProject,
            @RequestParam(name = "startDate", required = false) String startDate,
            @RequestParam(name = "endDate", required = false) String endDate) {
        Long userId = AuthUtils.requireUserId();
        UserAccount user = authService.getUserById(userId);
        Set<Long> allowedProjectIds = resolveAllowedProjectIds(user);
        int safePage = sanitizePage(page);
        int safeSize = sanitizeSize(size);

        // If projectId is specified, filter to only that project (if user has access)
        if (projectId != null) {
            if (!allowedProjectIds.contains(projectId)) {
                // User doesn't have access to this project
                return emptyResponse(safePage, safeSize);
            }
            allowedProjectIds = Collections.singleton(projectId);
        }

        if (allowedProjectIds.isEmpty()) {
            return emptyResponse(safePage, safeSize);
        }
        // Parse filter dates
        final LocalDate startLocalDate = parseDateOrNull(startDate);
        final LocalDate endLocalDate = parseDateOrNull(endDate);
        final Set<Long> scopedProjectIds = allowedProjectIds;

        List<TransferRecordDto> dtos = transferRecordRepository
                .findAllByOrderByTransferDateDesc()
                .stream()
                .filter(record -> {
                    Long fromId = record.getFromProject() != null ? record.getFromProject().getId() : null;
                    Long toId = record.getToProject() != null ? record.getToProject().getId() : null;
                    return (fromId != null && scopedProjectIds.contains(fromId)) ||
                            (toId != null && scopedProjectIds.contains(toId));
                })
                .filter(record -> filterTransfer(record, fromProject, toProject, startLocalDate, endLocalDate))
                .filter(record -> search == null || search.trim().isEmpty() || matchesTransferSearch(record, search))
                .map(this::toTransferRecordDto)
                .toList();

        return toPaginatedResponse(buildPageFromList(dtos, safePage, safeSize));
    }

    // ---- Helpers ----

    private List<InwardHistoryDto> filterInwardsByUser(UserAccount user) {
        List<InwardRecord> all = inwardRecordRepository.findAllByOrderByEntryDateDesc();
        Set<Long> allowedProjectIds = resolveAllowedProjectIds(user);
        if (allowedProjectIds.isEmpty()) {
            return Collections.emptyList();
        }
        List<InwardHistoryDto> dtos = new ArrayList<>();
        for (InwardRecord record : all) {
            Project project = record.getProject();
            if (project != null && allowedProjectIds.contains(project.getId())) {
                dtos.add(toInwardRecordDto(record));
            }
        }
        return dtos;
    }

    private List<OutwardRegisterDto> filterOutwardsByUser(UserAccount user) {
        List<OutwardRecord> all = outwardRecordRepository.findAllByOrderByEntryDateDesc();
        Set<Long> allowedProjectIds = resolveAllowedProjectIds(user);
        if (allowedProjectIds.isEmpty()) {
            return Collections.emptyList();
        }
        List<OutwardRegisterDto> dtos = new ArrayList<>();
        for (OutwardRecord rec : all) {
            Project project = rec.getProject();
            if (project != null && allowedProjectIds.contains(project.getId())) {
                dtos.add(toOutwardRegisterDto(rec));
            }
        }
        return dtos;
    }

    private List<TransferRecordDto> filterTransfersByUser(UserAccount user) {
        List<TransferRecord> all = transferRecordRepository.findAllByOrderByTransferDateDesc();
        Set<Long> allowedProjectIds = resolveAllowedProjectIds(user);
        if (allowedProjectIds.isEmpty()) {
            return Collections.emptyList();
        }
        List<TransferRecordDto> dtos = new ArrayList<>();
        for (TransferRecord record : all) {
            Long fromId = record.getFromProject() != null ? record.getFromProject().getId() : null;
            Long toId = record.getToProject() != null ? record.getToProject().getId() : null;
            boolean allowed = (fromId != null && allowedProjectIds.contains(fromId)) ||
                    (toId != null && allowedProjectIds.contains(toId));
            if (allowed) {
                dtos.add(toTransferRecordDto(record));
            }
        }
        return dtos;
    }

    private Set<Long> resolveAllowedProjectIds(UserAccount user) {
        // Users with ALL access can see all projects
        if (user.getAccessType() == AccessType.ALL) {
            return projectRepository
                    .findAll()
                    .stream()
                    .map(Project::getId)
                    .collect(Collectors.toSet());
        }
        return user
                .getProjects()
                .stream()
                .map(Project::getId)
                .collect(Collectors.toSet());
    }

    private <T> PaginatedResponse<T> emptyResponse(int page, int size) {
        return toPaginatedResponse(buildPageFromList(Collections.emptyList(), page, size));
    }

    private <T> Page<T> buildPageFromList(List<T> items, int page, int size) {
        int safeSize = sanitizeSize(size);
        int safePage = sanitizePage(page);
        int totalItems = items != null ? items.size() : 0;
        int fromIndex = Math.max(0, (safePage - 1) * safeSize);
        int toIndex = Math.min(fromIndex + safeSize, totalItems);
        List<T> pageItems = fromIndex < toIndex ? items.subList(fromIndex, toIndex) : List.of();
        return new PageImpl<>(pageItems, PageRequest.of(safePage - 1, safeSize), totalItems);
    }

    private <T> PaginatedResponse<T> toPaginatedResponse(Page<T> page) {
        return new PaginatedResponse<>(
                page.getContent(),
                page.getTotalElements(),
                Math.max(1, page.getTotalPages()),
                page.getSize(),
                page.getNumber(),
                page.hasNext(),
                page.hasPrevious(),
                Collections.emptyMap());
    }

    private int sanitizePage(int page) {
        return page <= 0 ? 1 : page;
    }

    private int sanitizeSize(int size) {
        if (size <= 0) {
            return 10;
        }
        return Math.min(size, 100);
    }

    // Mapping functions to DTOs. These mirror logic in AppDataService but are
    // redefined here
    // because AppDataService methods are private.
    private InwardHistoryDto toInwardRecordDto(InwardRecord record) {
        // Map lines - create light DTOs for history
        List<InwardLineDto> lines = new ArrayList<>();
        for (InwardLine line : record.getLines()) {
            Material mat = line.getMaterial();
            InwardLineDto dto = new InwardLineDto();
            dto.setId(line.getId());
            dto.setMaterialId(mat != null ? mat.getId() : null);
            dto.setMaterialCode(mat != null ? mat.getCode() : null);
            dto.setMaterialName(mat != null ? mat.getName() : null);
            dto.setUnit(mat != null ? mat.getUnit() : null);
            dto.setOrderedQty(line.getOrderedQty());
            dto.setReceivedQty(line.getReceivedQty());
            lines.add(dto);
        }
        Project project = record.getProject();
        return new InwardHistoryDto(
                record.getId() != null ? String.valueOf(record.getId()) : null,
                project != null && project.getId() != null ? String.valueOf(project.getId()) : null,
                project != null ? project.getName() : null,
                record.getCode(),
                record.getEntryDate() != null ? DATE_FMT.format(record.getEntryDate()) : null,
                record.getDeliveryDate() != null ? DATE_FMT.format(record.getDeliveryDate()) : null,
                record.getInvoiceNo(),
                record.getSupplierName(),
                record.getType() != null ? record.getType().name() : "SUPPLY",
                record.isValidated(),
                lines.size(),
                lines);
    }

    private OutwardRegisterDto toOutwardRegisterDto(OutwardRecord record) {
        // Map lines
        List<OutwardLineDto> lines = new ArrayList<>();
        for (OutwardLine line : record.getLines()) {
            Material mat = line.getMaterial();
            lines.add(new OutwardLineDto(
                    String.valueOf(line.getId()),
                    mat != null && mat.getId() != null ? String.valueOf(mat.getId()) : null,
                    mat != null ? mat.getCode() : null,
                    mat != null ? mat.getName() : null,
                    mat != null ? mat.getUnit() : null,
                    line.getIssueQty()));
        }
        Project project = record.getProject();
        return new OutwardRegisterDto(
                record.getId() != null ? String.valueOf(record.getId()) : null,
                project != null && project.getId() != null ? String.valueOf(project.getId()) : null,
                project != null ? project.getName() : null,
                record.getCode(),
                record.getDate() != null ? DATE_FMT.format(record.getDate()) : null,
                record.getIssueTo(),
                record.isValidated(),
                lines.size(),
                lines);
    }

    private TransferRecordDto toTransferRecordDto(TransferRecord record) {
        // Map lines
        List<TransferLineDto> lines = new ArrayList<>();
        for (TransferLine line : record.getLines()) {
            Material mat = line.getMaterial();
            lines.add(new TransferLineDto(
                    String.valueOf(line.getId()),
                    mat != null && mat.getId() != null ? String.valueOf(mat.getId()) : null,
                    mat != null ? mat.getCode() : null,
                    mat != null ? mat.getName() : null,
                    mat != null ? mat.getUnit() : null,
                    line.getTransferQty()));
        }
        Project from = record.getFromProject();
        Project to = record.getToProject();
        return new TransferRecordDto(
                record.getId() != null ? String.valueOf(record.getId()) : null,
                record.getCode(),
                from != null && from.getId() != null ? String.valueOf(from.getId()) : null,
                from != null ? from.getName() : null,
                record.getFromSite(),
                to != null && to.getId() != null ? String.valueOf(to.getId()) : null,
                to != null ? to.getName() : null,
                record.getToSite(),
                record.getTransferDate() != null ? DATE_FMT.format(record.getTransferDate()) : null,
                record.getRemarks(),
                lines,
                lines.size() // Add items count
        );
    }

    // ---- Filter helpers ----

    private LocalDate parseDateOrNull(String dateStr) {
        if (dateStr == null || dateStr.isEmpty()) {
            return null;
        }
        try {
            return LocalDate.parse(dateStr, DATE_FMT);
        } catch (Exception e) {
            return null;
        }
    }

    private boolean filterInward(InwardRecord record, String supplierName, String invoiceNo, LocalDate startDate,
            LocalDate endDate) {
        if (supplierName != null && !supplierName.isEmpty()) {
            if (record.getSupplierName() == null
                    || !record.getSupplierName().toLowerCase().contains(supplierName.toLowerCase())) {
                return false;
            }
        }
        if (invoiceNo != null && !invoiceNo.isEmpty()) {
            if (record.getInvoiceNo() == null
                    || !record.getInvoiceNo().toLowerCase().contains(invoiceNo.toLowerCase())) {
                return false;
            }
        }
        if (startDate != null && record.getEntryDate() != null && record.getEntryDate().isBefore(startDate)) {
            return false;
        }
        if (endDate != null && record.getEntryDate() != null && record.getEntryDate().isAfter(endDate)) {
            return false;
        }
        return true;
    }

    private boolean filterOutward(OutwardRecord record, String issueTo, String jobNo, LocalDate startDate,
            LocalDate endDate) {
        if (issueTo != null && !issueTo.isEmpty()) {
            if (record.getIssueTo() == null || !record.getIssueTo().toLowerCase().contains(issueTo.toLowerCase())) {
                return false;
            }
        }
        if (jobNo != null && !jobNo.isEmpty()) {
            if (record.getCode() == null || !record.getCode().toLowerCase().contains(jobNo.toLowerCase())) {
                return false;
            }
        }
        if (startDate != null && record.getDate() != null && record.getDate().isBefore(startDate)) {
            return false;
        }
        if (endDate != null && record.getDate() != null && record.getDate().isAfter(endDate)) {
            return false;
        }
        return true;
    }

    private boolean filterTransfer(TransferRecord record, String fromProject, String toProject, LocalDate startDate,
            LocalDate endDate) {
        if (fromProject != null && !fromProject.isEmpty()) {
            String fromProjectName = record.getFromProject() != null ? record.getFromProject().getName() : null;
            if (fromProjectName == null || !fromProjectName.toLowerCase().contains(fromProject.toLowerCase())) {
                return false;
            }
        }
        if (toProject != null && !toProject.isEmpty()) {
            String toProjectName = record.getToProject() != null ? record.getToProject().getName() : null;
            if (toProjectName == null || !toProjectName.toLowerCase().contains(toProject.toLowerCase())) {
                return false;
            }
        }
        if (startDate != null && record.getTransferDate() != null && record.getTransferDate().isBefore(startDate)) {
            return false;
        }
        if (endDate != null && record.getTransferDate() != null && record.getTransferDate().isAfter(endDate)) {
            return false;
        }
        return true;
    }

    private boolean matchesInwardSearch(InwardRecord record, String search) {
        String lowerSearch = search.toLowerCase();
        return (record.getCode() != null && record.getCode().toLowerCase().contains(lowerSearch)) ||
                (record.getSupplierName() != null && record.getSupplierName().toLowerCase().contains(lowerSearch)) ||
                (record.getInvoiceNo() != null && record.getInvoiceNo().toLowerCase().contains(lowerSearch)) ||
                (record.getProject() != null && record.getProject().getName() != null &&
                        record.getProject().getName().toLowerCase().contains(lowerSearch))
                ||
                (record.getLines() != null && record.getLines().stream()
                        .anyMatch(line -> (line.getMaterial() != null && line.getMaterial().getName() != null &&
                                line.getMaterial().getName().toLowerCase().contains(lowerSearch)) ||
                                (line.getMaterial() != null && line.getMaterial().getCode() != null &&
                                        line.getMaterial().getCode().toLowerCase().contains(lowerSearch))));
    }

    private boolean matchesOutwardSearch(OutwardRecord record, String search) {
        String lowerSearch = search.toLowerCase();
        return (record.getCode() != null && record.getCode().toLowerCase().contains(lowerSearch)) ||
                (record.getIssueTo() != null && record.getIssueTo().toLowerCase().contains(lowerSearch)) ||
                (record.getProject() != null && record.getProject().getName() != null &&
                        record.getProject().getName().toLowerCase().contains(lowerSearch))
                ||
                (record.getLines() != null && record.getLines().stream()
                        .anyMatch(line -> (line.getMaterial() != null && line.getMaterial().getName() != null &&
                                line.getMaterial().getName().toLowerCase().contains(lowerSearch)) ||
                                (line.getMaterial() != null && line.getMaterial().getCode() != null &&
                                        line.getMaterial().getCode().toLowerCase().contains(lowerSearch))));
    }

    private boolean matchesTransferSearch(TransferRecord record, String search) {
        String lowerSearch = search.toLowerCase();
        return (record.getCode() != null && record.getCode().toLowerCase().contains(lowerSearch)) ||
                (record.getFromProject() != null && record.getFromProject().getName() != null &&
                        record.getFromProject().getName().toLowerCase().contains(lowerSearch))
                ||
                (record.getToProject() != null && record.getToProject().getName() != null &&
                        record.getToProject().getName().toLowerCase().contains(lowerSearch))
                ||
                (record.getLines() != null && record.getLines().stream()
                        .anyMatch(line -> (line.getMaterial() != null && line.getMaterial().getName() != null &&
                                line.getMaterial().getName().toLowerCase().contains(lowerSearch)) ||
                                (line.getMaterial() != null && line.getMaterial().getCode() != null &&
                                        line.getMaterial().getCode().toLowerCase().contains(lowerSearch))));
    }
}
