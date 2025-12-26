package com.vebops.store.service;

import com.vebops.store.dto.InventoryCodesResponse;
import com.vebops.store.dto.InwardLineRequest;
import com.vebops.store.dto.InwardRequest;
import com.vebops.store.dto.OutwardLineRequest;
import com.vebops.store.dto.OutwardRequest;
import com.vebops.store.dto.OutwardUpdateRequest;
import com.vebops.store.dto.TransferRequest;
import com.vebops.store.exception.BadRequestException;
import com.vebops.store.exception.ForbiddenException;
import com.vebops.store.exception.NotFoundException;
import com.vebops.store.model.AccessType;
import com.vebops.store.model.BomLine;
import com.vebops.store.model.InwardLine;
import com.vebops.store.model.InwardRecord;
import com.vebops.store.model.InwardType;
import com.vebops.store.model.Material;
import com.vebops.store.model.OutwardLine;
import com.vebops.store.model.OutwardRecord;
import com.vebops.store.model.Project;
import com.vebops.store.model.TransferLine;
import com.vebops.store.model.TransferRecord;
import com.vebops.store.model.UserAccount;
import com.vebops.store.repository.BomLineRepository;
import com.vebops.store.repository.InwardLineRepository;
import com.vebops.store.repository.InwardRecordRepository;
import com.vebops.store.repository.MaterialRepository;
import com.vebops.store.repository.OutwardLineRepository;
import com.vebops.store.repository.OutwardRecordRepository;
import com.vebops.store.repository.ProjectRepository;
import com.vebops.store.repository.TransferRecordRepository;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class InventoryService {

    private static final Logger log = LoggerFactory.getLogger(InventoryService.class);

    private final ProjectRepository projectRepository;
    private final MaterialRepository materialRepository;
    private final InwardRecordRepository inwardRecordRepository;
    private final OutwardRecordRepository outwardRecordRepository;
    private final TransferRecordRepository transferRecordRepository;
    private final BomLineRepository bomLineRepository;
    private final InwardLineRepository inwardLineRepository;
    private final OutwardLineRepository outwardLineRepository;

    private static final DateTimeFormatter CODE_DATE = DateTimeFormatter.BASIC_ISO_DATE;

    public InventoryService(
            ProjectRepository projectRepository,
            MaterialRepository materialRepository,
            InwardRecordRepository inwardRecordRepository,
            OutwardRecordRepository outwardRecordRepository,
            TransferRecordRepository transferRecordRepository,
            BomLineRepository bomLineRepository,
            InwardLineRepository inwardLineRepository,
            OutwardLineRepository outwardLineRepository) {
        this.projectRepository = projectRepository;
        this.materialRepository = materialRepository;
        this.inwardRecordRepository = inwardRecordRepository;
        this.outwardRecordRepository = outwardRecordRepository;
        this.transferRecordRepository = transferRecordRepository;
        this.bomLineRepository = bomLineRepository;
        this.inwardLineRepository = inwardLineRepository;
        this.outwardLineRepository = outwardLineRepository;
    }

    public InventoryCodesResponse generateCodes() {
        return new InventoryCodesResponse(
                buildShortCode("I", inwardRecordRepository.count() + 1),
                buildShortCode("O", outwardRecordRepository.count() + 1),
                buildShortCode("T", transferRecordRepository.count() + 1));
    }

    @Transactional
    public void registerInward(UserAccount user, InwardRequest request) {
        log.info("registerInward: Processing inward request for projectId={}, lines={}",
                request.projectId(), request.lines() != null ? request.lines().size() : 0);

        Project project = requireProject(request.projectId());
        assertProjectAccess(user, project);
        if (request.lines() == null || request.lines().isEmpty()) {
            log.warn("registerInward: No inward lines provided");
            throw new BadRequestException("At least one inward line is required");
        }

        InwardRecord record = new InwardRecord();
        record.setCode(resolveOrGenerateCode(request.code(), () -> generateCodes().inwardCode()));
        record.setProject(project);
        record.setType(
                StringUtils.hasText(request.type())
                        ? InwardType.valueOf(request.type())
                        : InwardType.SUPPLY);
        record.setInvoiceNo(request.invoiceNo());
        record.setInvoiceDate(parseDate(request.invoiceDate()));
        record.setDeliveryDate(parseDate(request.deliveryDate()));
        record.setVehicleNo(request.vehicleNo());
        record.setRemarks(request.remarks());
        record.setSupplierName(request.supplierName());
        record.setEntryDate(
                record.getDeliveryDate() != null ? record.getDeliveryDate() : LocalDate.now());

        // Outward record linking removed - RETURN type no longer supported

        List<InwardLine> lines = new ArrayList<>();

        // Track quantities for this request so we don't over-count same-material lines
        Map<Long, Double> pendingReceivedByMaterial = new HashMap<>();
        Map<Long, Double> pendingOrderedByMaterial = new HashMap<>();

        request.lines().forEach(lineReq -> {
            log.debug("registerInward: Processing line - materialId={}, orderedQty={}, receivedQty={}",
                    lineReq.materialId(), lineReq.orderedQty(), lineReq.receivedQty());

            // Sanitize quantities (no negative qty)
            double orderedQty = Math.max(0d, lineReq.orderedQty());
            double receivedQty = Math.max(0d, lineReq.receivedQty());

            // Return logic removed - RETURN type no longer supported

            // Ignore completely empty lines
            if (orderedQty <= 0d && receivedQty <= 0d) {
                log.debug("registerInward: Skipping empty line for materialId={}", lineReq.materialId());
                return;
            }

            Material material = requireMaterial(lineReq.materialId());

            // SUPPLY Logic: Check Allocations
            double allocation = requireBomAllocation(project, material);
            log.debug("registerInward: Material={}, allocation={}", material.getCode(), allocation);

            // Check ORDERED quantity against allocation
            double alreadyOrdered = safeDouble(
                    inwardLineRepository.sumOrderedQtyByProjectAndMaterial(
                            project.getId(),
                            material.getId()));
            double pendingOrdered = pendingOrderedByMaterial.getOrDefault(material.getId(), 0d);
            double nextOrderedTotal = alreadyOrdered + pendingOrdered + orderedQty;

            if (nextOrderedTotal > allocation) {
                log.warn("registerInward: Ordered qty {} exceeds allocation {} for material={}",
                        nextOrderedTotal, allocation, material.getCode());
                throw new BadRequestException(
                        "Ordering "
                                + material.getCode()
                                + " exceeds the allocated requirement ("
                                + allocation
                                + "). Please reduce the ordered quantity or update the project allocation.");
            }

            // Check RECEIVED quantity against allocation
            double alreadyReceived = safeDouble(
                    inwardLineRepository.sumReceivedQtyByProjectAndMaterial(
                            project.getId(),
                            material.getId()));
            double pendingReceived = pendingReceivedByMaterial.getOrDefault(material.getId(), 0d);
            double nextReceivedTotal = alreadyReceived + pendingReceived + receivedQty;

            if (nextReceivedTotal > allocation) {
                log.warn("registerInward: Received qty {} exceeds allocation {} for material={}",
                        nextReceivedTotal, allocation, material.getCode());
                throw new BadRequestException(
                        "Receiving "
                                + material.getCode()
                                + " exceeds the allocated requirement.");
            }

            // Keep track for this request
            pendingOrderedByMaterial.put(material.getId(), pendingOrdered + orderedQty);
            pendingReceivedByMaterial.put(material.getId(), pendingReceived + receivedQty);

            // Create inward line
            InwardLine line = new InwardLine();
            line.setRecord(record);
            line.setMaterial(material);
            line.setOrderedQty(orderedQty);
            line.setReceivedQty(receivedQty);
            lines.add(line);

            // Update material aggregates - SUPPLY type only
            if (orderedQty > 0d) {
                material.setOrderedQty(material.getOrderedQty() + orderedQty);
            }
            if (receivedQty > 0d) {
                material.setReceivedQty(material.getReceivedQty() + receivedQty);
            }
            material.syncBalance();
        });

        if (lines.isEmpty()) {
            log.warn("registerInward: No valid inward lines with quantities");
            throw new BadRequestException("At least one inward line with quantity is required");
        }

        record.setLines(lines);
        inwardRecordRepository.save(record);
        log.info("registerInward: Successfully saved inward record with code={}, lines={}",
                record.getCode(), lines.size());
    }

    @Transactional
    public void registerOutward(UserAccount user, OutwardRequest request) {
        if (request.lines() == null || request.lines().isEmpty()) {
            throw new BadRequestException("At least one outward line is required");
        }

        Project project = requireProject(request.projectId());
        assertProjectAccess(user, project);
        LocalDate requestedDate = parseDate(request.date());
        final LocalDate entryDate = requestedDate != null ? requestedDate : LocalDate.now();

        OutwardRecord record = new OutwardRecord();
        record.setProject(project);
        record.setDate(entryDate);
        record.setEntryDate(entryDate);
        record.setCode(resolveOrGenerateCode(request.code(), () -> generateCodes().outwardCode()));
        record.setIssueTo(request.issueTo());

        // Status management removed - outwards are always open

        // Status check removed - outwards are always editable

        List<OutwardLine> lines = new ArrayList<>();

        // Track issues happening IN THIS REQUEST per material
        Map<Long, Double> pendingIssuesByMaterial = new HashMap<>();
        // Cache DB totals to avoid repeating queries
        Map<Long, Double> issuedCache = new HashMap<>();
        Map<Long, Double> receivedCache = new HashMap<>();
        for (var lineReq : request.lines()) {
            double requestedIssueQty = Math.max(0d, lineReq.issueQty());
            if (requestedIssueQty <= 0d) {
                continue;
            }

            Material material = requireMaterial(lineReq.materialId());

            // 1) Compute project-wise received & already issued (from DB)
            double totalReceivedForProject = receivedCache.computeIfAbsent(
                    material.getId(),
                    id -> safeDouble(
                            inwardLineRepository.sumReceivedQtyByProjectAndMaterial(
                                    project.getId(),
                                    id)));

            double alreadyIssued = issuedCache.computeIfAbsent(
                    material.getId(),
                    id -> safeDouble(
                            outwardLineRepository.sumIssuedQtyByProjectAndMaterial(
                                    project.getId(),
                                    id)));

            // What this request has already decided to issue for this material
            double pending = pendingIssuesByMaterial.getOrDefault(material.getId(), 0d);

            // Project-wise balance BEFORE this line is processed
            double projectBalance = totalReceivedForProject - alreadyIssued - pending;
            if (projectBalance <= 0d) {
                throw new BadRequestException(
                        "No balance available for material "
                                + material.getCode()
                                + " in project "
                                + project.getCode());
            }

            // Also ensure we don't exceed global stock
            double globalAvailable = material.getBalanceQty();
            double effectiveAvailable = Math.min(projectBalance, globalAvailable);

            // Provide a more user‑friendly error when there is no stock available
            if (effectiveAvailable <= 0d) {
                throw new BadRequestException(
                        "Stock quantity is zero for material " + material.getCode() + " in project "
                                + project.getCode());
            }

            if (requestedIssueQty > effectiveAvailable) {
                throw new BadRequestException(
                        "Cannot issue " + requestedIssueQty + " " + material.getUnit()
                                + " of " + material.getCode()
                                + " for project " + project.getCode()
                                + ". Available quantity for this project is "
                                + effectiveAvailable + ".");
            }

            // If we reach here, project-wise and global-wise stock is OK
            double issueQty = requestedIssueQty;

            // 2) BOM allocation check (FINAL issueQty, not requestedIssueQty)
            // 2) BOM allocation check (using final issueQty)
            double allocation = requireBomAllocation(project, material);
            double nextTotal = alreadyIssued + pending + issueQty;

            if (nextTotal > allocation) {
                throw new BadRequestException(
                        "Issuing " + material.getCode()
                                + " exceeds the allocated requirement ("
                                + allocation
                                + "). Please request an increase before issuing more.");
            }

            // 3) Create outward line
            OutwardLine line = new OutwardLine();
            line.setRecord(record);
            line.setMaterial(material);
            line.setIssueQty(issueQty);
            lines.add(line);

            // 4) Update material aggregates
            material.setUtilizedQty(material.getUtilizedQty() + issueQty);
            material.syncBalance();

            pendingIssuesByMaterial.put(material.getId(), pending + issueQty);
        }

        if (lines.isEmpty()) {
            throw new BadRequestException("At least one outward line with quantity is required");
        }

        record.setLines(lines);
        outwardRecordRepository.save(record);
    }

    @Transactional
    public void updateOutward(Long recordId, OutwardUpdateRequest request) {
        OutwardRecord record = outwardRecordRepository
                .findById(recordId)
                .orElseThrow(() -> new NotFoundException("Outward record not found"));

        // Status check removed - all records are editable

        // 1) Index existing lines and capture current totals PER MATERIAL for this
        // record
        Map<Long, OutwardLine> existingById = record
                .getLines()
                .stream()
                .collect(Collectors.toMap(line -> line.getId(), line -> line));

        Map<Long, Double> currentRecordTotals = record
                .getLines()
                .stream()
                .filter(line -> line.getMaterial() != null && line.getMaterial().getId() != null)
                .collect(
                        Collectors.groupingBy(
                                line -> line.getMaterial().getId(),
                                Collectors.summingDouble(OutwardLine::getIssueQty)));

        // 2) Build next lines and aggregate requested totals per material for this
        // record
        List<OutwardLine> nextLines = new ArrayList<>();
        Map<Long, Double> requestedTotals = new HashMap<>();
        Map<Long, Material> requestedMaterials = new HashMap<>();

        if (request.lines() != null) {
            for (var lineReq : request.lines()) {
                if (lineReq.issueQty() <= 0) {
                    // Skip zero / negative quantities
                    continue;
                }

                Material material = requireMaterial(lineReq.materialId());
                requestedTotals.merge(material.getId(), lineReq.issueQty(), Double::sum);
                requestedMaterials.put(material.getId(), material);

                OutwardLine line = null;
                if (lineReq.lineId() != null) {
                    Long id = parseLong(lineReq.lineId());
                    line = existingById.get(id);
                }
                if (line == null) {
                    line = new OutwardLine();
                    line.setRecord(record);
                    line.setMaterial(material);
                }

                // For update we keep the requested quantity as–is.
                // BOM & balance checks are done below at aggregate level.
                line.setIssueQty(lineReq.issueQty());
                nextLines.add(line);
            }
        }

        // 3) BOM VALIDATION: ensure total issued (all records) <= BOM allocation
        Map<Long, Double> issuedCache = new HashMap<>();
        for (var entry : requestedTotals.entrySet()) {
            Long materialId = entry.getKey();
            Material material = requestedMaterials.get(materialId);
            if (material == null) {
                continue;
            }

            double allocation = requireBomAllocation(record.getProject(), material);

            double totalIssuedFromDb = issuedCache.computeIfAbsent(
                    materialId,
                    id -> safeDouble(
                            outwardLineRepository.sumIssuedQtyByProjectAndMaterial(
                                    record.getProject().getId(),
                                    id)));

            double currentContribution = currentRecordTotals.getOrDefault(materialId, 0d);
            double nextTotal = totalIssuedFromDb - currentContribution + entry.getValue();

            double totalReceivedForProject = safeDouble(
                    inwardLineRepository.sumReceivedQtyByProjectAndMaterial(
                            record.getProject().getId(),
                            materialId));

            // If we apply this update, total issued (all records) must not exceed what was
            // received
            if (nextTotal > totalReceivedForProject) {
                double currentlyIssuedWithoutThisRecord = totalIssuedFromDb - currentContribution;
                double projectBalance = totalReceivedForProject - currentlyIssuedWithoutThisRecord;
                if (projectBalance < 0d) {
                    projectBalance = 0d;
                }

                throw new BadRequestException(
                        "Cannot set issue quantity for material "
                                + material.getCode()
                                + " to "
                                + entry.getValue()
                                + " in project "
                                + record.getProject().getCode()
                                + " because project balance is only "
                                + projectBalance
                                + ".");
            }

            if (nextTotal > allocation) {
                throw new BadRequestException(
                        "Issuing "
                                + material.getCode()
                                + " exceeds the allocated requirement ("
                                + allocation
                                + "). Please request an increase before issuing more.");
            }
        }

        // 4) Sync Material.utilizedQty and balance based on delta from THIS record
        Set<Long> affectedMaterialIds = new HashSet<>();
        affectedMaterialIds.addAll(currentRecordTotals.keySet());
        affectedMaterialIds.addAll(requestedTotals.keySet());

        for (Long materialId : affectedMaterialIds) {
            Material material = requestedMaterials.get(materialId);
            if (material == null) {
                material = record
                        .getLines()
                        .stream()
                        .filter(line -> line.getMaterial() != null && materialId.equals(line.getMaterial().getId()))
                        .map(OutwardLine::getMaterial)
                        .findFirst()
                        .orElse(null);
            }

            if (material == null) {
                continue;
            }

            double prevQty = currentRecordTotals.getOrDefault(materialId, 0d);
            double newQty = requestedTotals.getOrDefault(materialId, 0d);
            double diff = newQty - prevQty;

            if (diff == 0d) {
                continue;
            }

            // Optional extra safety: do not exceed global stock
            if (diff > 0d) {
                double available = material.getBalanceQty();
                if (diff > available) {
                    throw new BadRequestException(
                            "Cannot increase issue quantity for "
                                    + material.getCode()
                                    + " by "
                                    + diff
                                    + " because only "
                                    + available
                                    + " is available in stock.");
                }
            }

            double nextUtilized = material.getUtilizedQty() + diff;
            if (nextUtilized < 0d) {
                nextUtilized = 0d;
            }
            material.setUtilizedQty(nextUtilized);
            material.syncBalance();
        }

        // 5) Replace lines and update record meta-data
        record.getLines().clear();
        record.getLines().addAll(nextLines);

        // Status management removed

        if (StringUtils.hasText(request.issueTo())) {
            record.setIssueTo(request.issueTo());
        }

        outwardRecordRepository.save(record);
    }

    @Transactional
    public void registerTransfer(UserAccount user, TransferRequest request) {
        if (!StringUtils.hasText(request.toProjectId())) {
            throw new BadRequestException("Destination project is required");
        }
        Project fromProject = requireProject(request.fromProjectId());
        Project toProject = requireProject(request.toProjectId());
        assertProjectAccess(user, fromProject);
        assertProjectAccess(user, toProject);

        if (request.lines() == null || request.lines().isEmpty()) {
            throw new BadRequestException("At least one transfer line is required");
        }

        String fromSite = StringUtils.hasText(request.fromSite()) ? request.fromSite().trim() : null;
        String toSite = StringUtils.hasText(request.toSite()) ? request.toSite().trim() : null;

        if (fromProject.getId().equals(toProject.getId())) {
            if (!StringUtils.hasText(fromSite) || !StringUtils.hasText(toSite)) {
                throw new BadRequestException(
                        "Provide both source and destination sites when transferring within a project");
            }
            if (fromSite.equalsIgnoreCase(toSite)) {
                throw new BadRequestException("Cannot transfer within the same project site");
            }
        }

        TransferRecord record = new TransferRecord();
        record.setCode(resolveOrGenerateCode(request.code(), () -> generateCodes().transferCode()));
        record.setFromProject(fromProject);
        record.setToProject(toProject);
        record.setFromSite(fromSite);
        record.setToSite(toSite);
        record.setRemarks(request.remarks());
        record.setTransferDate(LocalDate.now());

        List<TransferLine> lines = new ArrayList<>();
        List<OutwardLineRequest> outwardLines = new ArrayList<>();
        List<InwardLineRequest> inwardLines = new ArrayList<>();

        request
                .lines()
                .forEach(lineReq -> {
                    if (lineReq.transferQty() <= 0) {
                        return;
                    }
                    Material material = requireMaterial(lineReq.materialId());
                    TransferLine line = new TransferLine();
                    line.setRecord(record);
                    line.setMaterial(material);
                    line.setTransferQty(lineReq.transferQty());
                    lines.add(line);

                    //
                    // For site‑to‑site transfers we want the transferred quantity to be
                    // immediately reflected as received on the destination side.
                    // Therefore we record an outward issue from the source project and
                    // an inward receipt on the destination project with the
                    // `receivedQty` equal to the transfer quantity and no outstanding
                    // ordered quantity. This contrasts with the previous logic of
                    // recording the quantity as an ordered amount (orderedQty) and
                    // deferring receipt.
                    outwardLines.add(new OutwardLineRequest(lineReq.materialId(), lineReq.transferQty()));
                    inwardLines.add(new InwardLineRequest(lineReq.materialId(), 0d, lineReq.transferQty()));
                });

        if (lines.isEmpty()) {
            throw new BadRequestException("Transfer quantity must be greater than zero");
        }

        // Persist the transfer record
        record.setLines(lines);
        transferRecordRepository.save(record);

        // Auto-create outward (source) and inward (destination) movements based on the
        // transfer
        // Bypass closed check to allow transfers even when outward register is closed
        registerOutward(
                user,
                new OutwardRequest(
                        null,
                        request.fromProjectId(),
                        "Transfer to " + toProject.getCode(),
                        null,
                        null,
                        null,
                        outwardLines,
                        true // bypass closed check for transfers
                ));

        registerInward(
                user,
                new InwardRequest(
                        null,
                        request.toProjectId(),
                        InwardType.SUPPLY.name(),
                        null,
                        null,
                        null,
                        null,
                        "Transfer from " + fromProject.getCode(),
                        fromProject.getName(),
                        null, // outwardId is null for transfers
                        inwardLines));
    }

    private String resolveOrGenerateCode(String requested, Supplier<String> generator) {
        if (StringUtils.hasText(requested)) {
            return requested.trim();
        }
        return generator.get();
    }

    private String buildShortCode(String prefix, long sequence) {
        long safeSequence = Math.max(1, sequence);
        return String.format("%s%04d", prefix, safeSequence);
    }

    private String buildDailyCode(String prefix, LocalDate date, long sequence) {
        long safeSequence = Math.max(1, sequence);
        return String.format("%s-%s-%03d", prefix, CODE_DATE.format(date), safeSequence);
    }

    private void assertProjectAccess(UserAccount user, Project project) {
        if (user == null) {
            throw new ForbiddenException("Authentication required");
        }
        if (user.getAccessType() == AccessType.ALL) {
            return;
        }
        boolean allowed = user.getProjects()
                .stream()
                .anyMatch(assigned -> assigned.getId().equals(project.getId()));
        if (!allowed) {
            throw new ForbiddenException("You do not have access to this project");
        }
    }

    private Project requireProject(String id) {
        return projectRepository.findById(parseLong(id)).orElseThrow(() -> new NotFoundException("Project not found"));
    }

    private Material requireMaterial(String id) {
        return materialRepository.findById(parseLong(id))
                .orElseThrow(() -> new NotFoundException("Material not found"));
    }

    private double requireBomAllocation(Project project, Material material) {
        if (project == null || material == null) {
            throw new BadRequestException("Project and material are required");
        }
        BomLine line = bomLineRepository
                .findByProjectIdAndMaterialId(project.getId(), material.getId())
                .orElseThrow(() -> new BadRequestException(
                        "Material " + material.getCode() + " is not allocated to this project"));
        return line.getQuantity();
    }

    private double safeDouble(Double value) {
        return value != null ? value : 0d;
    }

    private LocalDate parseDate(String date) {
        if (!StringUtils.hasText(date)) {
            return null;
        }
        try {
            return LocalDate.parse(date);
        } catch (java.time.format.DateTimeParseException ex) {
            throw new BadRequestException("Invalid date format. Please use YYYY-MM-DD.");
        }
    }

    private Long parseLong(String value) {
        if (!StringUtils.hasText(value)) {
            throw new BadRequestException("Identifier is required");
        }
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException ex) {
            throw new BadRequestException("Identifier must be a number");
        }
    }
}
