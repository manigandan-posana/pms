package com.vebops.store.controller;

import com.vebops.store.dto.AllocationOverviewDto;
import com.vebops.store.dto.BomAllocationRequest;
import com.vebops.store.dto.BomLineDto;
import com.vebops.store.dto.PaginatedResponse;
import com.vebops.store.exception.BadRequestException;
import com.vebops.store.model.Role;
import com.vebops.store.service.AuthService;
import com.vebops.store.service.BomService;
import com.vebops.store.util.AuthUtils;
import java.util.List;
import org.springframework.util.StringUtils;
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
@RequestMapping("/api/bom")
public class BomController {

    private final AuthService authService;
    private final BomService bomService;

    public BomController(AuthService authService, BomService bomService) {
        this.authService = authService;
        this.bomService = bomService;
    }

    /**
     * Returns paginated bill‑of‑materials lines for the given project. If the
     * page or size parameters are missing or invalid, sensible defaults are
     * applied. The returned {@link com.vebops.store.dto.PaginatedResponse}
     * mirrors the structure used by other endpoints in this application.
     *
     * @param projectId the project identifier (required)
     * @param page optional 1‑based page number (defaults to 1)
     * @param size optional page size (defaults to 10)
     * @return a paginated response containing BOM lines for the project
     */
    @GetMapping("/projects/{projectId}")
    public PaginatedResponse<BomLineDto> listLines(
        @PathVariable String projectId,
        @RequestParam(name = "page", defaultValue = "1") int page,
        @RequestParam(name = "size", defaultValue = "10") int size,
        @RequestParam(name = "search", required = false) String search,
        @RequestParam(name = "inStockOnly", defaultValue = "false") boolean inStockOnly
    ) {
        AuthUtils.requireAdmin();
        return bomService.listLines(projectId, page, size, search, inStockOnly);
    }

    @GetMapping("/allocations")
    public List<AllocationOverviewDto> listAllocations(
        @RequestParam(name = "search", required = false) String search
    ) {
        AuthUtils.requireAdmin();
        return bomService.listAllocations(search);
    }

    @PostMapping("/projects/{projectId}/materials")
    public BomLineDto createLine(
        @PathVariable String projectId,
        @RequestBody BomAllocationRequest request
    ) {
        AuthUtils.requireAdmin();
        double quantity = request != null ? request.quantity() : 0d;
        String resolvedProjectId = (request != null && StringUtils.hasText(request.projectId())) ? request.projectId() : projectId;
        String resolvedMaterialId = request != null ? request.materialId() : null;
        if (!StringUtils.hasText(resolvedMaterialId)) {
            throw new BadRequestException("Material id is required");
        }
        return bomService.assignQuantity(resolvedProjectId, resolvedMaterialId, quantity);
    }

    @PutMapping("/projects/{projectId}/materials/{materialId}")
    public BomLineDto assignQuantity(
        @PathVariable String projectId,
        @PathVariable String materialId,
        @RequestBody BomAllocationRequest request
    ) {
        AuthUtils.requireAdmin();
        double quantity = request != null ? request.quantity() : 0d;
        String resolvedProjectId = (request != null && StringUtils.hasText(request.projectId())) ? request.projectId() : projectId;
        String resolvedMaterialId = (request != null && StringUtils.hasText(request.materialId())) ? request.materialId() : materialId;
        return bomService.assignQuantity(resolvedProjectId, resolvedMaterialId, quantity);
    }

    @DeleteMapping("/projects/{projectId}/materials/{materialId}")
    public void deleteLine(
        @PathVariable String projectId,
        @PathVariable String materialId
    ) {
        AuthUtils.requireAdmin();
        bomService.deleteLine(projectId, materialId);
    }
}
