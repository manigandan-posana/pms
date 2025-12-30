package com.vebops.store.service;

import com.vebops.store.dto.AppBootstrapResponse;
import com.vebops.store.dto.BomLineDto;
import com.vebops.store.dto.InwardLineDto;
import com.vebops.store.dto.InwardHistoryDto;
import com.vebops.store.dto.MaterialDto;
import com.vebops.store.dto.MaterialMovementDto;
import com.vebops.store.dto.OutwardLineDto;
import com.vebops.store.dto.OutwardRegisterDto;
import com.vebops.store.dto.ProjectDto;
import com.vebops.store.dto.TransferLineDto;
import com.vebops.store.dto.TransferRecordDto;
import com.vebops.store.dto.ProjectDetailsDto;
import com.vebops.store.dto.ProjectTeamMemberDto;
import com.vebops.store.dto.ProjectTeamAssignmentRequest;
import com.vebops.store.dto.UserDto;

import com.vebops.store.model.ProjectTeamMember;
import com.vebops.store.exception.BadRequestException;
import com.vebops.store.exception.ForbiddenException;
import com.vebops.store.exception.NotFoundException;
import com.vebops.store.model.AccessType;
import com.vebops.store.model.BomLine;
import com.vebops.store.model.InwardLine;
import com.vebops.store.model.InwardRecord;
import com.vebops.store.model.Material;
import com.vebops.store.model.OutwardRecord;
import com.vebops.store.model.Project;
import com.vebops.store.model.Role;
import com.vebops.store.model.TransferRecord;
import com.vebops.store.model.UserAccount;
import com.vebops.store.repository.BomLineRepository;
import com.vebops.store.repository.InwardLineRepository;
import com.vebops.store.repository.InwardRecordRepository;
import com.vebops.store.repository.MaterialRepository;
import com.vebops.store.repository.OutwardLineRepository;
import com.vebops.store.repository.OutwardRecordRepository;
import com.vebops.store.repository.ProjectRepository;
import com.vebops.store.repository.ProjectTeamMemberRepository;

import com.vebops.store.repository.TransferRecordRepository;
import com.vebops.store.repository.UserRepository;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class AppDataService {

        private final ProjectRepository projectRepository;
        private final MaterialRepository materialRepository;
        private final BomLineRepository bomLineRepository;
        private final InwardLineRepository inwardLineRepository;
        private final InwardRecordRepository inwardRecordRepository;
        private final OutwardLineRepository outwardLineRepository;
        private final OutwardRecordRepository outwardRecordRepository;
        private final TransferRecordRepository transferRecordRepository;
        private final UserRepository userRepository;
        private final AuthService authService;
        private final InventoryService inventoryService;
        private final ProjectTeamMemberRepository projectTeamMemberRepository;

        private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

        public AppDataService(
                        ProjectRepository projectRepository,
                        BomLineRepository bomLineRepository,
                        InwardLineRepository inwardLineRepository,
                        OutwardLineRepository outwardLineRepository,
                        TransferRecordRepository transferRecordRepository,
                        InwardRecordRepository inwardRecordRepository,
                        OutwardRecordRepository outwardRecordRepository,
                        MaterialRepository materialRepository,
                        ProjectTeamMemberRepository projectTeamMemberRepository,
                        UserRepository userRepository,
                        AuthService authService,
                        InventoryService inventoryService) {
                this.projectRepository = projectRepository;
                this.bomLineRepository = bomLineRepository;
                this.inwardLineRepository = inwardLineRepository;
                this.outwardLineRepository = outwardLineRepository;
                this.transferRecordRepository = transferRecordRepository;
                this.inwardRecordRepository = inwardRecordRepository;
                this.outwardRecordRepository = outwardRecordRepository;
                this.materialRepository = materialRepository;
                this.projectTeamMemberRepository = projectTeamMemberRepository;
                this.userRepository = userRepository;
                this.authService = authService;
                this.inventoryService = inventoryService;
        }

        public AppBootstrapResponse bootstrap(UserAccount user) {
                List<Project> allProjects = projectRepository.findAll();
                List<ProjectDto> allProjectDtos = allProjects.stream().map(this::toProjectDto).toList();

                List<Project> assigned = resolveAssignedProjects(user, allProjects);
                List<ProjectDto> assignedDtos = assigned.stream().map(this::toProjectDto).toList();

                List<MaterialDto> materialDtos = materialRepository
                                .findAll()
                                .stream()
                                .sorted(Comparator.comparing(Material::getCode))
                                .map(this::toMaterialDto)
                                .toList();

                Map<String, List<BomLineDto>> bom = new LinkedHashMap<>();
                for (Project project : allProjects) {
                        List<BomLineDto> lines = bomLineRepository
                                        .findByProjectId(project.getId())
                                        .stream()
                                        .map(this::toBomLineDto)
                                        .toList();
                        bom.put(String.valueOf(project.getId()), lines);
                }

                Set<Long> allowedProjectIds = assigned.stream().map(Project::getId).collect(Collectors.toSet());

                List<InwardHistoryDto> inward = inwardRecordRepository
                                .findAllByOrderByEntryDateDesc()
                                .stream()
                                .filter(rec -> allowedProjectIds.contains(rec.getProject().getId()))
                                .map(this::toInwardRecordDto)
                                .toList();

                List<OutwardRegisterDto> outward = outwardRecordRepository
                                .findAllByOrderByEntryDateDesc()
                                .stream()
                                .filter(rec -> allowedProjectIds.contains(rec.getProject().getId()))
                                .map(this::toOutwardDto)
                                .toList();

                List<TransferRecordDto> transfers = transferRecordRepository
                                .findAllByOrderByTransferDateDesc()
                                .stream()
                                .filter(rec -> {
                                        Long fromId = rec.getFromProject() != null ? rec.getFromProject().getId()
                                                        : null;
                                        Long toId = rec.getToProject() != null ? rec.getToProject().getId() : null;
                                        return (fromId != null && allowedProjectIds.contains(fromId)) ||
                                                        (toId != null && allowedProjectIds.contains(toId));
                                })
                                .map(this::toTransferDto)
                                .toList();

                UserDto userDto = authService.toUserDto(user);

                return new AppBootstrapResponse(
                                userDto,
                                allProjectDtos,
                                assignedDtos,
                                bom,
                                materialDtos,
                                inward,
                                outward,
                                transfers,
                                inventoryService.generateCodes());
        }

        public List<InwardHistoryDto> materialInwardHistory(UserAccount user, Long materialId) {
                if (materialId == null) {
                        throw new BadRequestException("Material id is required");
                }
                List<Project> allProjects = projectRepository.findAll();
                List<Project> assigned = resolveAssignedProjects(user, allProjects);
                Set<Long> allowedProjectIds = assigned.stream().map(Project::getId).collect(Collectors.toSet());

                return inwardRecordRepository
                                .findByLinesMaterialIdOrderByEntryDateDesc(materialId)
                                .stream()
                                .filter(rec -> allowedProjectIds.contains(rec.getProject().getId()))
                                .map(rec -> toInwardRecordDto(rec, materialId))
                                .toList();
        }

        public MaterialMovementDto materialMovementHistory(UserAccount user, Long materialId) {
                if (materialId == null) {
                        throw new BadRequestException("Material id is required");
                }
                List<Project> allProjects = projectRepository.findAll();
                List<Project> assigned = resolveAssignedProjects(user, allProjects);
                Set<Long> allowedProjectIds = assigned.stream().map(Project::getId).collect(Collectors.toSet());

                List<InwardHistoryDto> inwards = inwardRecordRepository
                                .findByLinesMaterialIdOrderByEntryDateDesc(materialId)
                                .stream()
                                .filter(rec -> allowedProjectIds.contains(rec.getProject().getId()))
                                .map(rec -> toInwardRecordDto(rec, materialId))
                                .toList();

                List<OutwardRegisterDto> outwards = outwardRecordRepository
                                .findByLinesMaterialIdOrderByEntryDateDesc(materialId)
                                .stream()
                                .filter(rec -> allowedProjectIds.contains(rec.getProject().getId()))
                                .map(rec -> toOutwardDto(rec, materialId))
                                .toList();

                return new MaterialMovementDto(inwards, outwards);
        }

        public List<BomLineDto> projectBom(UserAccount user, Long projectId, String search, boolean inStockOnly) {
                if (projectId == null) {
                        return List.of();
                }
                if (!hasProjectAccess(user, projectId)) {
                        throw new ForbiddenException("You do not have access to this project");
                }
                List<BomLineDto> lines = bomLineRepository
                                .findByProjectId(projectId)
                                .stream()
                                .map(this::toBomLineDto)
                                .toList();
                Stream<BomLineDto> stream = lines.stream();
                if (StringUtils.hasText(search)) {
                        String term = search.trim().toLowerCase();
                        stream = stream.filter(line -> (line.code() != null && line.code().toLowerCase().contains(term))
                                        ||
                                        (line.name() != null && line.name().toLowerCase().contains(term)) ||
                                        (line.category() != null && line.category().toLowerCase().contains(term)));
                }
                if (inStockOnly) {
                        stream = stream.filter(line -> line.balanceQty() > 0);
                }
                return stream.toList();
        }

        private List<Project> resolveAssignedProjects(UserAccount user, List<Project> allProjects) {
                if (user.getRole() == Role.ADMIN || user.getAccessType() == AccessType.ALL) {
                        return allProjects;
                }
                Set<Long> accessibleIds = user.getProjects().stream()
                                .map(Project::getId)
                                .collect(Collectors.toSet());

                projectTeamMemberRepository.findByUser_Id(user.getId())
                                .stream()
                                .map(ptm -> ptm.getProject().getId())
                                .forEach(accessibleIds::add);

                return allProjects.stream()
                                .filter(p -> {
                                        if (accessibleIds.contains(p.getId())) {
                                                return true;
                                        }
                                        String pm = p.getProjectManager();
                                        return pm != null && (pm.equalsIgnoreCase(user.getName())
                                                        || pm.equalsIgnoreCase(user.getEmail()));
                                })
                                .toList();
        }

        public boolean hasProjectAccess(UserAccount user, Long projectId) {
                if (user == null || projectId == null) {
                        return false;
                }
                if (user.getRole() == Role.ADMIN || user.getAccessType() == AccessType.ALL) {
                        return true;
                }
                boolean inProjects = user.getProjects().stream().anyMatch(project -> project.getId().equals(projectId));
                if (inProjects) {
                        return true;
                }
                if (projectTeamMemberRepository.existsByProject_IdAndUser_Id(projectId, user.getId())) {
                        return true;
                }
                return projectRepository.findById(projectId)
                                .map(p -> {
                                        String pm = p.getProjectManager();
                                        // Project Manager (as a string) might be Name or Email.
                                        // We should check if the current user matches that PM string.
                                        return pm != null && (pm.equalsIgnoreCase(user.getName())
                                                        || pm.equalsIgnoreCase(user.getEmail()));
                                })
                                .orElse(false);
        }

        private ProjectDto toProjectDto(Project project) {
                return new ProjectDto(
                                String.valueOf(project.getId()),
                                project.getCode(),
                                project.getName(),
                                project.getProjectManager());
        }

        private MaterialDto toMaterialDto(Material material) {
                return new MaterialDto(
                                String.valueOf(material.getId()),
                                material.getCode(),
                                material.getName(),
                                material.getPartNo(),
                                material.getLineType(),
                                material.getUnit(),
                                material.getCategory(),
                                material.getRequiredQty(),
                                material.getOrderedQty(),
                                material.getReceivedQty(),
                                material.getUtilizedQty(),
                                material.getBalanceQty());
        }

        private BomLineDto toBomLineDto(BomLine line) {
                Material material = line.getMaterial();
                Project project = line.getProject();
                ProjectMaterialTotals totals = project != null && material != null
                                ? computeProjectMaterialTotals(project.getId(), material.getId())
                                : new ProjectMaterialTotals(0d, 0d, 0d, 0d);
                return new BomLineDto(
                                line.getId() != null ? String.valueOf(line.getId()) : null,
                                project != null && project.getId() != null ? String.valueOf(project.getId()) : null,
                                material != null && material.getId() != null ? String.valueOf(material.getId()) : null,
                                material != null ? material.getCode() : null,
                                material != null ? material.getName() : null,
                                material != null ? material.getPartNo() : null,
                                material != null ? material.getLineType() : null,
                                material != null ? material.getUnit() : null,
                                material != null ? material.getCategory() : null,
                                line.getQuantity(),
                                line.getQuantity(),
                                totals.orderedQty(),
                                totals.receivedQty(),
                                totals.issuedQty(),
                                totals.balanceQty());
        }

        private ProjectMaterialTotals computeProjectMaterialTotals(Long projectId, Long materialId) {
                double orderedQty = safeDouble(
                                inwardLineRepository.sumOrderedQtyByProjectAndMaterial(projectId, materialId));
                double receivedQty = safeDouble(
                                inwardLineRepository.sumReceivedQtyByProjectAndMaterial(projectId, materialId));
                // returnedQty removed - RETURN type no longer supported
                double issuedQty = safeDouble(
                                outwardLineRepository.sumIssuedQtyByProjectAndMaterial(projectId, materialId));
                double balanceQty = Math.max(0d, receivedQty - issuedQty);
                return new ProjectMaterialTotals(orderedQty, receivedQty, issuedQty, balanceQty);
        }

        private double safeDouble(Double value) {
                return value != null ? value : 0d;
        }

        private record ProjectMaterialTotals(double orderedQty, double receivedQty,
                        double issuedQty,
                        double balanceQty) {
        }

        private InwardHistoryDto toInwardRecordDto(InwardRecord record) {
                return toInwardRecordDto(record, null);
        }

        private InwardHistoryDto toInwardRecordDto(InwardRecord record, Long materialFilterId) {
                List<InwardLineDto> lines = record
                                .getLines()
                                .stream()
                                .filter(line -> materialFilterId == null
                                                || (line.getMaterial() != null
                                                                && materialFilterId.equals(line.getMaterial().getId())))
                                .map(this::toInwardLineDto)
                                .toList();
                return new InwardHistoryDto(
                                String.valueOf(record.getId()),
                                String.valueOf(record.getProject().getId()),
                                record.getProject() != null ? record.getProject().getName() : null,
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

        private InwardLineDto toInwardLineDto(InwardLine line) {
                InwardLineDto dto = new InwardLineDto();
                dto.setId(line.getId());
                dto.setMaterialId(line.getMaterial() != null ? line.getMaterial().getId() : null);
                dto.setMaterialCode(line.getMaterial() != null ? line.getMaterial().getCode() : null);
                dto.setMaterialName(line.getMaterial() != null ? line.getMaterial().getName() : null);
                dto.setUnit(line.getMaterial() != null ? line.getMaterial().getUnit() : null);
                dto.setOrderedQty(line.getOrderedQty());
                dto.setReceivedQty(line.getReceivedQty());
                return dto;
        }

        private OutwardRegisterDto toOutwardDto(OutwardRecord record) {
                return toOutwardDto(record, null);
        }

        private OutwardRegisterDto toOutwardDto(OutwardRecord record, Long materialFilterId) {
                List<OutwardLineDto> lines = record
                                .getLines()
                                .stream()
                                .filter(line -> materialFilterId == null
                                                || (line.getMaterial() != null
                                                                && materialFilterId.equals(line.getMaterial().getId())))
                                .map(line -> new OutwardLineDto(
                                                String.valueOf(line.getId()),
                                                line.getMaterial() != null ? String.valueOf(line.getMaterial().getId())
                                                                : null,
                                                line.getMaterial() != null ? line.getMaterial().getCode() : null,
                                                line.getMaterial() != null ? line.getMaterial().getName() : null,
                                                line.getMaterial() != null ? line.getMaterial().getUnit() : null,
                                                line.getIssueQty()))
                                .toList();

                return new OutwardRegisterDto(
                                String.valueOf(record.getId()),
                                String.valueOf(record.getProject().getId()),
                                record.getProject() != null ? record.getProject().getName() : null,
                                record.getCode(),
                                record.getDate() != null ? DATE_FMT.format(record.getDate()) : null,
                                record.getIssueTo(),
                                record.isValidated(),
                                lines.size(),
                                lines);
        }

        private TransferRecordDto toTransferDto(TransferRecord record) {
                List<TransferLineDto> lines = record
                                .getLines()
                                .stream()
                                .map(line -> new TransferLineDto(
                                                String.valueOf(line.getId()),
                                                line.getMaterial() != null ? String.valueOf(line.getMaterial().getId())
                                                                : null,
                                                line.getMaterial() != null ? line.getMaterial().getCode() : null,
                                                line.getMaterial() != null ? line.getMaterial().getName() : null,
                                                line.getMaterial() != null ? line.getMaterial().getUnit() : null,
                                                line.getTransferQty()))
                                .toList();

                return new TransferRecordDto(
                                String.valueOf(record.getId()),
                                record.getCode(),
                                record.getFromProject() != null ? String.valueOf(record.getFromProject().getId())
                                                : null,
                                record.getFromProject() != null ? record.getFromProject().getName() : null,
                                record.getFromSite(),
                                record.getToProject() != null ? String.valueOf(record.getToProject().getId()) : null,
                                record.getToProject() != null ? record.getToProject().getName() : null,
                                record.getToSite(),
                                record.getTransferDate() != null ? DATE_FMT.format(record.getTransferDate()) : null,
                                record.getRemarks(),
                                lines,
                                lines.size() // Add items count
                );
        }

        public List<ProjectDto> getUserProjects(UserAccount user) {
                List<Project> allProjects = projectRepository.findAll();
                List<Project> accessibleProjects = resolveAssignedProjects(user, allProjects);
                return accessibleProjects.stream().map(this::toProjectDto).toList();
        }

        public ProjectDetailsDto getProjectDetails(UserAccount user, Long projectId) {
                if (!hasProjectAccess(user, projectId)) {
                        throw new ForbiddenException("You do not have access to this project");
                }
                Project project = projectRepository.findById(projectId)
                                .orElseThrow(() -> new NotFoundException("Project not found"));

                List<ProjectTeamMemberDto> team = projectTeamMemberRepository
                                .findByProject_Id(projectId)
                                .stream()
                                .map(this::toTeamMemberDto)
                                .toList();

                return new ProjectDetailsDto(
                                String.valueOf(project.getId()),
                                project.getCode(),
                                project.getName(),
                                project.getProjectManager(),
                                team);
        }

        public ProjectDetailsDto updateProjectTeam(UserAccount user, Long projectId,
                        List<ProjectTeamAssignmentRequest> assignments) {
                Project project = projectRepository.findById(projectId)
                                .orElseThrow(() -> new NotFoundException("Project not found"));

                if (!hasProjectAccess(user, projectId)) {
                        throw new ForbiddenException("You do not have access to this project");
                }

                boolean isPm = project.getProjectManager() != null &&
                                (project.getProjectManager().equalsIgnoreCase(user.getName()) ||
                                                project.getProjectManager().equalsIgnoreCase(user.getEmail()));

                if (!isPm && user.getRole() != Role.ADMIN) {
                        throw new ForbiddenException("Only the Project Manager can update the team");
                }

                List<ProjectTeamAssignmentRequest> safeAssignments = assignments == null
                                ? List.of()
                                : assignments;

                projectTeamMemberRepository.deleteByProject_Id(projectId);

                List<ProjectTeamMember> saved = new ArrayList<>();
                Set<UserAccount> usersNeedingProjectAccess = new HashSet<>();

                for (ProjectTeamAssignmentRequest assignment : safeAssignments) {
                        if (assignment == null || assignment.userId() == null || assignment.role() == null) {
                                continue;
                        }
                        UserAccount memberAccount = userRepository.findById(assignment.userId())
                                        .orElseThrow(() -> new NotFoundException("User not found for team assignment"));

                        boolean alreadyHas = memberAccount.getProjects().stream()
                                        .anyMatch(p -> p.getId().equals(projectId));
                        if (!alreadyHas) {
                                memberAccount.getProjects().add(project);
                                usersNeedingProjectAccess.add(memberAccount);
                        }

                        ProjectTeamMember member = new ProjectTeamMember();
                        member.setProject(project);
                        member.setUser(memberAccount);
                        member.setRole(assignment.role());
                        saved.add(projectTeamMemberRepository.save(member));
                }

                if (!usersNeedingProjectAccess.isEmpty()) {
                        userRepository.saveAll(usersNeedingProjectAccess);
                }

                List<ProjectTeamMemberDto> team = saved.stream().map(this::toTeamMemberDto).toList();
                return new ProjectDetailsDto(
                                String.valueOf(project.getId()),
                                project.getCode(),
                                project.getName(),
                                project.getProjectManager(),
                                team);
        }

        private ProjectTeamMemberDto toTeamMemberDto(ProjectTeamMember member) {
                return new ProjectTeamMemberDto(
                                member.getId() != null ? String.valueOf(member.getId()) : null,
                                member.getUser() != null && member.getUser().getId() != null
                                                ? String.valueOf(member.getUser().getId())
                                                : null,
                                member.getUser() != null ? member.getUser().getName() : null,
                                member.getUser() != null ? member.getUser().getEmail() : null,
                                member.getRole() != null ? member.getRole().name() : null);
        }

        public List<UserDto> searchUsers(String query) {
                if (!StringUtils.hasText(query)) {
                        // Return all users (or reasonable limit)
                        return userRepository.findAll().stream().map(authService::toUserDto).toList();
                }
                return userRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(query, query)
                                .stream()
                                .map(authService::toUserDto)
                                .toList();
        }
}
