package com.vebops.store.controller;

import com.vebops.store.dto.AppBootstrapResponse;
import com.vebops.store.dto.InwardHistoryDto;
import com.vebops.store.dto.MaterialMovementDto;
import com.vebops.store.model.UserAccount;
import com.vebops.store.service.AppDataService;
import com.vebops.store.service.AuthService;
import com.vebops.store.util.AuthUtils;
import java.util.List;
import com.vebops.store.dto.ProjectDetailsDto;
import com.vebops.store.dto.ProjectTeamAssignmentRequest;
import com.vebops.store.dto.UserDto;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/app")
public class AppController {

    private final AuthService authService;
    private final AppDataService appDataService;

    public AppController(AuthService authService, AppDataService appDataService) {
        this.authService = authService;
        this.appDataService = appDataService;
    }

    @GetMapping("/bootstrap")
    public AppBootstrapResponse bootstrap() {
        Long userId = AuthUtils.requireUserId();
        UserAccount user = authService.getUserById(userId);
        return appDataService.bootstrap(user);
    }

    @GetMapping("/materials/{materialId}/inwards")
    public List<InwardHistoryDto> materialInwardHistory(
            @PathVariable Long materialId) {
        Long userId = AuthUtils.requireUserId();
        UserAccount user = authService.getUserById(userId);
        return appDataService.materialInwardHistory(user, materialId);
    }

    @GetMapping("/materials/{materialId}/movements")
    public MaterialMovementDto materialMovementHistory(
            @PathVariable Long materialId) {
        Long userId = AuthUtils.requireUserId();
        UserAccount user = authService.getUserById(userId);
        return appDataService.materialMovementHistory(user, materialId);
    }

    @GetMapping("/projects")
    public List<com.vebops.store.dto.ProjectDto> getUserProjects() {
        Long userId = AuthUtils.requireUserId();
        UserAccount user = authService.getUserById(userId);
        return appDataService.getUserProjects(user);
    }

    @GetMapping("/projects/{projectId}/bom")
    public List<com.vebops.store.dto.BomLineDto> getProjectBom(
            @PathVariable Long projectId,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "inStockOnly", defaultValue = "false") boolean inStockOnly) {
        Long userId = AuthUtils.requireUserId();
        UserAccount user = authService.getUserById(userId);
        return appDataService.projectBom(user, projectId, search, inStockOnly);
    }

    @GetMapping("/projects/{projectId}")
    public ProjectDetailsDto getProjectDetails(@PathVariable Long projectId) {
        Long userId = AuthUtils.requireUserId();
        UserAccount user = authService.getUserById(userId);
        return appDataService.getProjectDetails(user, projectId);
    }

    @PutMapping("/projects/{projectId}/team")
    public ProjectDetailsDto updateProjectTeam(
            @PathVariable Long projectId,
            @RequestBody List<ProjectTeamAssignmentRequest> assignments) {
        Long userId = AuthUtils.requireUserId();
        UserAccount user = authService.getUserById(userId);
        return appDataService.updateProjectTeam(user, projectId, assignments);
    }

    @GetMapping("/users/search")
    public List<UserDto> searchUsers(@RequestParam String query) {
        return appDataService.searchUsers(query);
    }
}
