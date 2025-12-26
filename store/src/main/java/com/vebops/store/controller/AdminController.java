package com.vebops.store.controller;

import com.vebops.store.dto.AnalyticsDto;
import com.vebops.store.dto.CreateProjectRequest;
import com.vebops.store.dto.CreateUserRequest;
import com.vebops.store.dto.PaginatedResponse;
import com.vebops.store.dto.ProjectActivityDto;
import com.vebops.store.dto.ProjectDetailsDto;
import com.vebops.store.dto.ProjectDto;
import com.vebops.store.dto.ProjectTeamAssignmentRequest;
import com.vebops.store.dto.UpdateProjectRequest;
import com.vebops.store.dto.UpdateUserRequest;
import com.vebops.store.dto.UserDto;
import com.vebops.store.exception.UnauthorizedException;
import com.vebops.store.model.Permission;
import com.vebops.store.model.Role;
import com.vebops.store.model.UserAccount;
import com.vebops.store.service.AdminService;
import com.vebops.store.repository.UserRepository;
import com.vebops.store.util.AuthUtils;
import org.springframework.beans.factory.annotation.Value;
import com.vebops.store.service.AuthService;
import java.util.List;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AuthService authService;
    private final AdminService adminService;
    private final UserRepository userRepository;
    @Value("${azure.ad.admin-email:}")
    private String configuredAdminEmail;

    public AdminController(AuthService authService, AdminService adminService, UserRepository userRepository) {
        this.authService = authService;
        this.adminService = adminService;
        this.userRepository = userRepository;
    }

    /**
     * Bootstrap endpoint to assign ADMIN role to the configured admin email.
     * Only callable by the same configured admin Microsoft account.
     */
    @PostMapping("/bootstrap/assign-admin")
    public UserDto assignAdminRole(@RequestParam("email") String email) {
        // Get authenticated user's email from request attributes (set by AzureAdAuthenticationFilter)
        String callerEmail = AuthUtils.getUserEmail();
        
        if (configuredAdminEmail == null || configuredAdminEmail.isBlank()) {
            throw new UnauthorizedException("Configured admin email is not set");
        }
        if (!callerEmail.equalsIgnoreCase(configuredAdminEmail)) {
            throw new UnauthorizedException("Only the configured admin account can assign roles");
        }
        UserAccount target = userRepository.findByEmailIgnoreCase(email)
            .orElseGet(() -> {
                UserAccount ua = new UserAccount();
                ua.setEmail(email);
                ua.setName(email);
                ua.setRole(Role.USER);
                return userRepository.save(ua);
            });
        target.setRole(Role.ADMIN);
        userRepository.save(target);
        return authService.toUserDto(target);
    }

    @GetMapping("/projects")
    public PaginatedResponse<ProjectDto> projects(
        @RequestParam(name = "page", defaultValue = "1") int page,
        @RequestParam(name = "size", defaultValue = "10") int size,
        @RequestParam(name = "search", required = false) String search,
        @RequestParam(name = "startsWith", required = false) List<String> prefixes,
        @RequestParam(name = "allocation", required = false) String allocation
    ) {
        AuthUtils.requireAdminOrPermission(Permission.PROJECT_MANAGEMENT);
        return adminService.searchProjects(search, prefixes, allocation, page, size);
    }

    @GetMapping("/projects/{id}")
    public ProjectDetailsDto projectDetails(@PathVariable Long id) {
        AuthUtils.requireAdminOrPermission(Permission.PROJECT_MANAGEMENT);
        return adminService.getProjectDetails(id);
    }

    @GetMapping("/projects/search")
    public PaginatedResponse<ProjectDto> searchProjects(
        @RequestParam(name = "page", defaultValue = "1") int page,
        @RequestParam(name = "size", defaultValue = "10") int size,
        @RequestParam(name = "search", required = false) String search,
        @RequestParam(name = "startsWith", required = false) List<String> prefixes,
        @RequestParam(name = "allocation", required = false) String allocation
    ) {
        return projects(page, size, search, prefixes, allocation);
    }

    @PostMapping("/projects")
    public ProjectDto createProject(@Valid @RequestBody CreateProjectRequest request) {
        AuthUtils.requireAdminOrPermission(Permission.PROJECT_MANAGEMENT);
        return adminService.createProject(request);
    }

    @PutMapping("/projects/{id}")
    public ProjectDto updateProject(
        @PathVariable Long id,
        @Valid @RequestBody UpdateProjectRequest request
    ) {
        AuthUtils.requireAdminOrPermission(Permission.PROJECT_MANAGEMENT);
        return adminService.updateProject(id, request);
    }

    @DeleteMapping("/projects/{id}")
    public void deleteProject(@PathVariable Long id) {
        AuthUtils.requireAdminOrPermission(Permission.PROJECT_MANAGEMENT);
        adminService.deleteProject(id);
    }

    @PutMapping("/projects/{id}/team")
    public ProjectDetailsDto updateProjectTeam(
            @PathVariable Long id,
            @Valid @RequestBody List<ProjectTeamAssignmentRequest> assignments
    ) {
        AuthUtils.requireAdminOrPermission(Permission.PROJECT_MANAGEMENT);
        return adminService.updateProjectTeam(id, assignments);
    }

    @GetMapping("/users")
    public PaginatedResponse<UserDto> listUsers(
        @RequestParam(name = "page", defaultValue = "1") int page,
        @RequestParam(name = "size", defaultValue = "10") int size,
        @RequestParam(name = "search", required = false) String search,
        @RequestParam(name = "role", required = false) List<String> roles,
        @RequestParam(name = "accessType", required = false) List<String> accessTypes,
        @RequestParam(name = "projectId", required = false) List<String> projectIds
    ) {
        AuthUtils.requireAdminOrPermission(Permission.USER_MANAGEMENT);
        return adminService.searchUsers(authService, search, roles, accessTypes, projectIds, page, size);
    }

    @GetMapping("/users/search")
    public PaginatedResponse<UserDto> searchUsers(
        @RequestParam(name = "page", defaultValue = "1") int page,
        @RequestParam(name = "size", defaultValue = "10") int size,
        @RequestParam(name = "search", required = false) String search,
        @RequestParam(name = "role", required = false) List<String> roles,
        @RequestParam(name = "accessType", required = false) List<String> accessTypes,
        @RequestParam(name = "projectId", required = false) List<String> projectIds
    ) {
        return listUsers(page, size, search, roles, accessTypes, projectIds);
    }

    @PostMapping("/users")
    public UserDto createUser(@Valid @RequestBody CreateUserRequest request) {
        AuthUtils.requireAdminOrPermission(Permission.USER_MANAGEMENT);
        return adminService.createUser(request, authService);
    }

    @PutMapping("/users/{id}")
    public UserDto updateUser(
        @PathVariable Long id,
        @Valid @RequestBody UpdateUserRequest request
    ) {
        AuthUtils.requireAdminOrPermission(Permission.USER_MANAGEMENT);
        return adminService.updateUser(id, request, authService);
    }

    @DeleteMapping("/users/{id}")
    public void deleteUser(@PathVariable Long id) {
        AuthUtils.requireAdminOrPermission(Permission.USER_MANAGEMENT);
        adminService.deleteUser(id);
    }

    @GetMapping("/analytics")
    public AnalyticsDto analytics() {
        AuthUtils.requireAdminOrPermission(Permission.ADMIN_ACCESS);
        return adminService.analytics();
    }

    @GetMapping("/project-activity")
    public List<ProjectActivityDto> projectActivity() {
        AuthUtils.requireAdminOrPermission(Permission.ADMIN_ACCESS);
        return adminService.projectActivityOverview();
    }
}
