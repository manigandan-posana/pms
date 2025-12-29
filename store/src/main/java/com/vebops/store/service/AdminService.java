package com.vebops.store.service;

import com.vebops.store.dto.AnalyticsDto;
import com.vebops.store.dto.CreateProjectRequest;
import com.vebops.store.dto.CreateUserRequest;
import com.vebops.store.dto.PaginatedResponse;
import com.vebops.store.dto.ProjectActivityDto;
import com.vebops.store.dto.ProjectActivityEntryDto;
import com.vebops.store.dto.ProjectDetailsDto;
import com.vebops.store.dto.ProjectDto;
import com.vebops.store.dto.ProjectTeamAssignmentRequest;
import com.vebops.store.dto.ProjectTeamMemberDto;
import com.vebops.store.dto.UpdateProjectRequest;
import com.vebops.store.dto.UpdateUserRequest;
import com.vebops.store.dto.UserDto;
import com.vebops.store.exception.BadRequestException;
import com.vebops.store.exception.NotFoundException;
import com.vebops.store.model.AccessType;
import com.vebops.store.model.Project;
import com.vebops.store.model.ProjectRole;
import com.vebops.store.model.ProjectTeamMember;
import com.vebops.store.model.Permission;
import com.vebops.store.model.Role;
import com.vebops.store.model.UserAccount;
import com.vebops.store.repository.BomLineRepository;
import com.vebops.store.repository.InwardRecordRepository;
import com.vebops.store.repository.MaterialRepository;
import com.vebops.store.repository.OutwardRecordRepository;
import com.vebops.store.repository.ProjectRepository;
import com.vebops.store.repository.ProjectTeamMemberRepository;
import com.vebops.store.repository.TransferRecordRepository;
import com.vebops.store.repository.UserRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class AdminService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final MaterialRepository materialRepository;
    private final BomLineRepository bomLineRepository;
    private final InwardRecordRepository inwardRecordRepository;
    private final OutwardRecordRepository outwardRecordRepository;
    private final TransferRecordRepository transferRecordRepository;
    private final ProjectTeamMemberRepository projectTeamMemberRepository;
    private final PasswordEncoder passwordEncoder;

    private static final int MAX_RECENT_ITEMS = 5;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    public AdminService(
            ProjectRepository projectRepository,
            UserRepository userRepository,
            MaterialRepository materialRepository,
            BomLineRepository bomLineRepository,
            InwardRecordRepository inwardRecordRepository,
            OutwardRecordRepository outwardRecordRepository,
            TransferRecordRepository transferRecordRepository,
            ProjectTeamMemberRepository projectTeamMemberRepository,
            PasswordEncoder passwordEncoder) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.materialRepository = materialRepository;
        this.bomLineRepository = bomLineRepository;
        this.inwardRecordRepository = inwardRecordRepository;
        this.outwardRecordRepository = outwardRecordRepository;
        this.transferRecordRepository = transferRecordRepository;
        this.projectTeamMemberRepository = projectTeamMemberRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public PaginatedResponse<ProjectDto> searchProjects(
            String search,
            List<String> prefixes,
            String allocationFilter,
            int page,
            int size) {
        int safePage = normalizePage(page);
        int safeSize = normalizeSize(size);
        Specification<Project> spec = Specification.where(null);
        if (StringUtils.hasText(search)) {
            String query = "%" + search.trim().toLowerCase() + "%";
            spec = spec.and((root, q, cb) -> {
                Predicate code = cb.like(cb.lower(root.get("code")), query);
                Predicate name = cb.like(cb.lower(root.get("name")), query);
                return cb.or(code, name);
            });
        }
        if (prefixes != null && !prefixes.isEmpty()) {
            Set<String> normalized = prefixes
                    .stream()
                    .filter(StringUtils::hasText)
                    .map(String::trim)
                    .map(prefix -> prefix.substring(0, 1).toUpperCase())
                    .collect(Collectors.toSet());
            if (!normalized.isEmpty()) {
                spec = spec.and((root, q, cb) -> cb.upper(cb.substring(root.get("code"), 1, 1)).in(normalized));
            }
        }
        if (StringUtils.hasText(allocationFilter)) {
            Set<Long> allocatedProjects = bomLineRepository.projectIdsWithAllocations();
            if ("WITH_ALLOCATIONS".equalsIgnoreCase(allocationFilter)) {
                if (allocatedProjects.isEmpty()) {
                    spec = spec.and((root, q, cb) -> cb.disjunction());
                } else {
                    spec = spec.and((root, q, cb) -> root.get("id").in(allocatedProjects));
                }
            } else if ("WITHOUT_ALLOCATIONS".equalsIgnoreCase(allocationFilter) && !allocatedProjects.isEmpty()) {
                spec = spec.and((root, q, cb) -> cb.not(root.get("id").in(allocatedProjects)));
            }
        }
        Pageable pageable = PageRequest.of(safePage - 1, safeSize, Sort.by("code").ascending());
        Page<Project> result = projectRepository.findAll(spec, pageable);
        List<ProjectDto> items = result.stream().map(this::toProjectDto).toList();
        List<String> prefixOptions = projectRepository
                .distinctCodePrefixes()
                .stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .map(prefix -> prefix.substring(0, 1))
                .sorted()
                .toList();
        Map<String, List<String>> filters = Map.of("prefixes", prefixOptions);
        return new PaginatedResponse<>(
                items,
                result.getTotalElements(),
                Math.max(1, result.getTotalPages()),
                result.getSize(),
                result.getNumber(),
                result.hasNext(),
                result.hasPrevious(),
                filters);
    }

    public ProjectDto createProject(CreateProjectRequest request) {
        if (request == null || !StringUtils.hasText(request.name())) {
            throw new BadRequestException("Project name is required");
        }

        String code;
        if (StringUtils.hasText(request.code())) {
            code = request.code().trim();
            projectRepository
                    .findByCodeIgnoreCase(code)
                    .ifPresent(existing -> {
                        throw new BadRequestException("Project code already exists");
                    });
        } else {
            // Auto-generate short unique code
            code = generateProjectCode();
        }

        Project project = new Project();
        project.setCode(code);
        project.setName(request.name().trim());
        if (StringUtils.hasText(request.projectManager())) {
            project.setProjectManager(request.projectManager().trim());
        }
        return toProjectDto(projectRepository.save(project));
    }

    private String generateProjectCode() {
        long count = projectRepository.count();
        String code;
        do {
            count++;
            code = String.format("P%04d", count);
        } while (projectRepository.findByCodeIgnoreCase(code).isPresent());
        return code;
    }

    public ProjectDto updateProject(Long id, UpdateProjectRequest request) {
        Project project = projectRepository.findById(id).orElseThrow(() -> new NotFoundException("Project not found"));
        if (request == null || (!StringUtils.hasText(request.code()) && !StringUtils.hasText(request.name()))) {
            throw new BadRequestException("Project code or name is required");
        }
        if (StringUtils.hasText(request.code())) {
            String nextCode = request.code().trim();
            projectRepository
                    .findByCodeIgnoreCase(nextCode)
                    .ifPresent(existing -> {
                        if (!existing.getId().equals(id)) {
                            throw new BadRequestException("Project code already exists");
                        }
                    });
            project.setCode(nextCode);
        }
        if (StringUtils.hasText(request.name())) {
            project.setName(request.name().trim());
        }
        if (request.projectManager() != null) {
            String trimmedManager = request.projectManager().trim();
            project.setProjectManager(StringUtils.hasText(trimmedManager) ? trimmedManager : null);
        }
        return toProjectDto(projectRepository.save(project));
    }

    public ProjectDetailsDto getProjectDetails(Long id) {
        Project project = projectRepository.findById(id).orElseThrow(() -> new NotFoundException("Project not found"));
        List<ProjectTeamMemberDto> team = projectTeamMemberRepository
                .findByProject_Id(id)
                .stream()
                .map(this::toTeamDto)
                .toList();
        return new ProjectDetailsDto(
                project.getId().toString(),
                project.getCode(),
                project.getName(),
                project.getProjectManager(),
                team);
    }

    public ProjectDetailsDto updateProjectTeam(Long projectId, List<ProjectTeamAssignmentRequest> assignments) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NotFoundException("Project not found"));

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
            UserAccount user = userRepository.findById(assignment.userId())
                    .orElseThrow(() -> new NotFoundException("User not found for team assignment"));
            user.getProjects().add(project);
            usersNeedingProjectAccess.add(user);
            ProjectTeamMember member = new ProjectTeamMember();
            member.setProject(project);
            member.setUser(user);
            member.setRole(assignment.role());
            saved.add(projectTeamMemberRepository.save(member));
        }

        if (!usersNeedingProjectAccess.isEmpty()) {
            userRepository.saveAll(usersNeedingProjectAccess);
        }

        List<ProjectTeamMemberDto> team = saved.stream().map(this::toTeamDto).toList();
        return new ProjectDetailsDto(
                project.getId().toString(),
                project.getCode(),
                project.getName(),
                project.getProjectManager(),
                team);
    }

    public void deleteProject(Long id) {
        if (!projectRepository.existsById(id)) {
            throw new NotFoundException("Project not found");
        }
        projectRepository.deleteById(id);
    }

    public PaginatedResponse<UserDto> searchUsers(
            AuthService authService,
            String search,
            List<String> roles,
            List<String> accessTypes,
            List<String> projectIds,
            int page,
            int size) {
        int safePage = normalizePage(page);
        int safeSize = normalizeSize(size);
        Specification<UserAccount> spec = Specification.where(null);
        if (StringUtils.hasText(search)) {
            String query = "%" + search.trim().toLowerCase() + "%";
            spec = spec.and((root, q, cb) -> {
                Predicate name = cb.like(cb.lower(root.get("name")), query);
                Predicate email = cb.like(cb.lower(root.get("email")), query);
                Predicate roleMatch = cb.like(cb.lower(root.get("role")), query);
                return cb.or(name, email, roleMatch);
            });
        }
        if (roles != null && !roles.isEmpty()) {
            Set<Role> resolvedRoles = roles
                    .stream()
                    .filter(StringUtils::hasText)
                    .map(String::trim)
                    .map(String::toUpperCase)
                    .map(this::parseRoleValue)
                    .collect(Collectors.toSet());
            if (!resolvedRoles.isEmpty()) {
                spec = spec.and((root, q, cb) -> root.get("role").in(resolvedRoles));
            }
        }
        if (accessTypes != null && !accessTypes.isEmpty()) {
            Set<AccessType> resolved = accessTypes
                    .stream()
                    .filter(StringUtils::hasText)
                    .map(String::trim)
                    .map(String::toUpperCase)
                    .map(this::parseAccessValue)
                    .collect(Collectors.toSet());
            if (!resolved.isEmpty()) {
                spec = spec.and((root, q, cb) -> root.get("accessType").in(resolved));
            }
        }
        if (projectIds != null && !projectIds.isEmpty()) {
            Set<Long> resolved = projectIds
                    .stream()
                    .filter(StringUtils::hasText)
                    .map(String::trim)
                    .map(this::parseProjectId)
                    .collect(Collectors.toSet());
            if (!resolved.isEmpty()) {
                spec = spec.and((root, q, cb) -> {
                    q.distinct(true);
                    Join<UserAccount, Project> join = root.join("projects", JoinType.LEFT);
                    return join.get("id").in(resolved);
                });
            }
        }
        Pageable pageable = PageRequest.of(safePage - 1, safeSize,
                Sort.by("name").ascending().and(Sort.by("email").ascending()));
        Page<UserAccount> result = userRepository.findAll(spec, pageable);
        List<UserDto> items = result.stream().map(authService::toUserDto).toList();
        List<String> projectFilters = projectRepository
                .findAll(Sort.by("code").ascending())
                .stream()
                .map(Project::getId)
                .map(String::valueOf)
                .toList();
        Map<String, List<String>> filters = Map.of(
                "roles",
                Stream.of(Role.values()).map(Role::name).sorted().toList(),
                "accessTypes",
                Stream.of(AccessType.values()).map(AccessType::name).sorted().toList(),
                "projects",
                projectFilters);
        return new PaginatedResponse<>(
                items,
                result.getTotalElements(),
                Math.max(1, result.getTotalPages()),
                result.getSize(),
                result.getNumber(),
                result.hasNext(),
                result.hasPrevious(),
                filters);
    }

    public UserDto createUser(CreateUserRequest request, AuthService authService) {
        // Validate name and email (password is not used for Microsoft authentication)
        if (!StringUtils.hasText(request.name()) || !StringUtils.hasText(request.email())) {
            throw new BadRequestException("Name and email are required");
        }

        userRepository
                .findByEmailIgnoreCase(request.email())
                .ifPresent(existing -> {
                    throw new BadRequestException("Email already in use");
                });

        // Validate that project-scoped roles have at least one project assigned
        Role role = Role.valueOf(request.role());
        AccessType accessType = resolveAccessType(role, request.accessType());

        UserAccount user = new UserAccount();
        applyUserFields(user, request.name(), role, accessType, request.permissions(), null);
        user.setEmail(request.email().trim());
        // For Microsoft-authenticated users, no local password is stored. Use a fixed
        // placeholder so the NOT NULL constraint is satisfied but never used.
        user.setPasswordHash("$2a$10$AZURE_AD_USER_NO_PASSWORD_NEEDED");

        assignProjects(user, request.projectIds());
        return authService.toUserDto(userRepository.save(user));
    }

    public UserDto updateUser(Long id, UpdateUserRequest request, AuthService authService) {
        UserAccount user = userRepository.findById(id).orElseThrow(() -> new NotFoundException("User not found"));
        if (StringUtils.hasText(request.name())) {
            user.setName(request.name().trim());
        }
        // Ignore password updates entirely for Microsoft-authenticated users.
        Role nextRole = StringUtils.hasText(request.role()) ? Role.valueOf(request.role()) : user.getRole();
        AccessType nextAccess = resolveAccessType(nextRole, request.accessType());
        applyUserFields(user, user.getName(), nextRole, nextAccess, request.permissions(), user.getPermissions());
        if (request.projectIds() != null) {
            assignProjects(user, request.projectIds());
        }
        return authService.toUserDto(userRepository.save(user));
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    public AnalyticsDto analytics() {
        long totalProjects = projectRepository.count();
        long totalMaterials = materialRepository.count();
        long totalUsers = userRepository.count();
        double received = materialRepository.findAll().stream().mapToDouble(m -> m.getReceivedQty()).sum();
        double utilized = materialRepository.findAll().stream().mapToDouble(m -> m.getUtilizedQty()).sum();
        return new AnalyticsDto(totalProjects, totalMaterials, totalUsers, received, utilized);
    }

    public List<ProjectActivityDto> projectActivityOverview() {
        List<Project> projects = projectRepository.findAll(Sort.by("code").ascending());
        Map<Long, ProjectActivityAccumulator> byId = new LinkedHashMap<>();
        for (Project project : projects) {
            byId.put(project.getId(), new ProjectActivityAccumulator(project));
        }

        inwardRecordRepository.findAllByOrderByEntryDateDesc().forEach(record -> {
            Project project = record.getProject();
            if (project == null) {
                return;
            }
            ProjectActivityAccumulator acc = byId.get(project.getId());
            if (acc != null) {
                String date = record.getEntryDate() != null ? DATE_FMT.format(record.getEntryDate()) : null;
                int lineCount = record.getLines() != null ? record.getLines().size() : 0;
                String status = record.isValidated() ? "Validated" : "Pending";
                acc.addInward(new ProjectActivityEntryDto(
                        record.getId() != null ? String.valueOf(record.getId()) : null,
                        record.getCode(),
                        date,
                        record.getSupplierName(),
                        status,
                        lineCount,
                        "INWARD"));
            }
        });

        outwardRecordRepository.findAllByOrderByEntryDateDesc().forEach(record -> {
            Project project = record.getProject();
            if (project == null) {
                return;
            }
            ProjectActivityAccumulator acc = byId.get(project.getId());
            if (acc != null) {
                String date = record.getDate() != null ? DATE_FMT.format(record.getDate()) : null;
                int lineCount = record.getLines() != null ? record.getLines().size() : 0;
                String status = record.isValidated() ? "Validated" : "Pending";
                acc.addOutward(new ProjectActivityEntryDto(
                        record.getId() != null ? String.valueOf(record.getId()) : null,
                        record.getCode(),
                        date,
                        record.getIssueTo(),
                        status,
                        lineCount,
                        "OUTWARD"));
            }
        });

        transferRecordRepository.findAllByOrderByTransferDateDesc().forEach(record -> {
            Project from = record.getFromProject();
            Project to = record.getToProject();
            String date = record.getTransferDate() != null ? DATE_FMT.format(record.getTransferDate()) : null;
            int lineCount = record.getLines() != null ? record.getLines().size() : 0;
            String direction = (from != null ? from.getName() : "-") + " → " + (to != null ? to.getName() : "-");

            if (from != null) {
                ProjectActivityAccumulator acc = byId.get(from.getId());
                if (acc != null) {
                    acc.addTransfer(new ProjectActivityEntryDto(
                            record.getId() != null ? String.valueOf(record.getId()) : null,
                            record.getCode(),
                            date,
                            to != null ? to.getName() : "To project not set",
                            "Dispatched",
                            lineCount,
                            direction));
                }
            }

            if (to != null) {
                ProjectActivityAccumulator acc = byId.get(to.getId());
                if (acc != null) {
                    acc.addTransfer(new ProjectActivityEntryDto(
                            record.getId() != null ? String.valueOf(record.getId()) : null,
                            record.getCode(),
                            date,
                            from != null ? from.getName() : "From project not set",
                            "Received",
                            lineCount,
                            direction));
                }
            }
        });

        return byId.values().stream().map(ProjectActivityAccumulator::toDto).toList();
    }

    private static class ProjectActivityAccumulator {
        private final Project project;
        private int inwardCount = 0;
        private int outwardCount = 0;
        private int transferCount = 0;
        private final List<ProjectActivityEntryDto> recentInwards = new ArrayList<>();
        private final List<ProjectActivityEntryDto> recentOutwards = new ArrayList<>();
        private final List<ProjectActivityEntryDto> recentTransfers = new ArrayList<>();

        ProjectActivityAccumulator(Project project) {
            this.project = project;
        }

        void addInward(ProjectActivityEntryDto dto) {
            inwardCount++;
            addIfRoom(recentInwards, dto);
        }

        void addOutward(ProjectActivityEntryDto dto) {
            outwardCount++;
            addIfRoom(recentOutwards, dto);
        }

        void addTransfer(ProjectActivityEntryDto dto) {
            transferCount++;
            addIfRoom(recentTransfers, dto);
        }

        ProjectActivityDto toDto() {
            return new ProjectActivityDto(
                    project.getId(),
                    project.getCode(),
                    project.getName(),
                    inwardCount,
                    outwardCount,
                    transferCount,
                    recentInwards,
                    recentOutwards,
                    recentTransfers);
        }

        private void addIfRoom(List<ProjectActivityEntryDto> items, ProjectActivityEntryDto dto) {
            if (items.size() < MAX_RECENT_ITEMS) {
                items.add(dto);
            }
        }
    }

    private void applyUserFields(UserAccount user, String name, Role role, AccessType accessType,
            List<String> permissions, Set<Permission> currentPermissions) {
        user.setName(name.trim());
        user.setRole(role);
        user.setAccessType(accessType);
        user.setPermissions(resolvePermissions(role, permissions, currentPermissions));
    }

    private AccessType resolveAccessType(Role role, String requestedAccessType) {
        return switch (role) {
            case ADMIN -> AccessType.ALL;
            case USER_PLUS -> StringUtils.hasText(requestedAccessType)
                    ? AccessType.valueOf(requestedAccessType)
                    : AccessType.PROJECTS;
            case USER -> AccessType.PROJECTS;
            default -> throw new IllegalStateException("Unhandled role: " + role);
        };
    }

    private Set<Permission> resolvePermissions(Role role, List<String> requestedPermissions,
            Set<Permission> currentPermissions) {
        if (role == Role.ADMIN) {
            return EnumSet.allOf(Permission.class);
        }
        if (role == Role.USER) {
            return EnumSet.noneOf(Permission.class);
        }
        EnumSet<Permission> resolved = currentPermissions != null ? EnumSet.copyOf(currentPermissions)
                : EnumSet.noneOf(Permission.class);
        if (requestedPermissions != null) {
            resolved.clear();
            for (String value : requestedPermissions) {
                if (!StringUtils.hasText(value)) {
                    continue;
                }
                try {
                    resolved.add(Permission.valueOf(value));
                } catch (IllegalArgumentException ex) {
                    throw new BadRequestException("Unknown permission: " + value);
                }
            }
        }
        return resolved;
    }

    private void assignProjects(UserAccount user, List<String> projectIds) {
        if (projectIds == null) {
            user.getProjects().clear();
            return;
        }
        Set<Project> projects = projectIds
                .stream()
                .filter(StringUtils::hasText)
                .map(Long::valueOf)
                .map(id -> projectRepository.findById(id).orElseThrow(() -> new NotFoundException("Project not found")))
                .collect(Collectors.toSet());
        user.getProjects().clear();
        user.getProjects().addAll(projects);
    }

    private ProjectDto toProjectDto(Project project) {
        return new ProjectDto(
                String.valueOf(project.getId()),
                project.getCode(),
                project.getName(),
                project.getProjectManager());
    }

    private ProjectTeamMemberDto toTeamDto(ProjectTeamMember member) {
        return new ProjectTeamMemberDto(
                member.getId() != null ? member.getId().toString() : null,
                member.getUser() != null && member.getUser().getId() != null ? member.getUser().getId().toString()
                        : null,
                member.getUser() != null ? member.getUser().getName() : null,
                member.getUser() != null ? member.getUser().getEmail() : null,
                member.getRole() != null ? member.getRole().name() : null);
    }

    private int normalizePage(int page) {
        return page <= 0 ? 1 : page;
    }

    private int normalizeSize(int size) {
        if (size <= 0) {
            return 10;
        }
        return Math.min(size, 100);
    }

    private Role parseRoleValue(String value) {
        try {
            return Role.valueOf(value);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Unknown role: " + value);
        }
    }

    private AccessType parseAccessValue(String value) {
        try {
            return AccessType.valueOf(value);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Unknown access type: " + value);
        }
    }

    private Long parseProjectId(String value) {
        try {
            return Long.valueOf(value);
        } catch (NumberFormatException ex) {
            throw new BadRequestException("Invalid project id: " + value);
        }
    }
}
