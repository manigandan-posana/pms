package com.vebops.store.service;

import com.vebops.store.dto.AllocationOverviewDto;
import com.vebops.store.dto.BomLineDto;
import com.vebops.store.exception.BadRequestException;
import com.vebops.store.exception.NotFoundException;
import com.vebops.store.model.BomLine;
import com.vebops.store.model.Material;
import com.vebops.store.model.Project;
import com.vebops.store.repository.BomLineRepository;
import com.vebops.store.repository.InwardLineRepository;
import com.vebops.store.repository.MaterialRepository;
import com.vebops.store.repository.OutwardLineRepository;
import com.vebops.store.repository.ProjectRepository;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import com.vebops.store.dto.PaginatedResponse;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import java.util.stream.Stream;

@Service
public class BomService {

    private final BomLineRepository bomLineRepository;
    private final ProjectRepository projectRepository;
    private final MaterialRepository materialRepository;
    private final InwardLineRepository inwardLineRepository;
    private final OutwardLineRepository outwardLineRepository;

    public BomService(
            BomLineRepository bomLineRepository,
            ProjectRepository projectRepository,
            MaterialRepository materialRepository,
            InwardLineRepository inwardLineRepository,
            OutwardLineRepository outwardLineRepository) {
        this.bomLineRepository = bomLineRepository;
        this.projectRepository = projectRepository;
        this.materialRepository = materialRepository;
        this.inwardLineRepository = inwardLineRepository;
        this.outwardLineRepository = outwardLineRepository;
    }

    public BomLineDto assignQuantity(String projectId, String materialId, double quantity) {
        if (quantity < 0) {
            throw new BadRequestException("Quantity must be zero or greater");
        }
        Project project = requireProject(projectId);
        Material material = requireMaterial(materialId);
        BomLine line = upsertLine(project, material, quantity);
        return toDto(line);
    }

    public List<BomLineDto> listLines(String projectId) {
        Project project = requireProject(projectId);
        return bomLineRepository.findByProjectId(project.getId()).stream().map(this::toDto).toList();
    }

    /**
     * Return paginated bill of materials lines for the given project. The returned
     * {@link com.vebops.store.dto.PaginatedResponse} contains metadata about
     * the total number of items, total pages and whether there are next/previous
     * pages. If the provided page is less than 1 it will default to 1 and the
     * size will be constrained between 1 and 100.
     *
     * @param projectId the id of the project whose BOM lines are requested
     * @param page      a 1‑based page number
     * @param size      the number of items per page
     * @return a paginated response containing BOM line DTOs
     */
    public PaginatedResponse<BomLineDto> listLines(String projectId, int page, int size) {
        return listLines(projectId, page, size, null, false);
    }

    public PaginatedResponse<BomLineDto> listLines(
            String projectId,
            int page,
            int size,
            String search,
            boolean inStockOnly) {
        Project project = requireProject(projectId);
        int safePage = page < 1 ? 1 : page;
        int safeSize;
        if (size < 1) {
            safeSize = 10;
        } else {
            safeSize = Math.min(size, 100);
        }
        List<BomLineDto> allItems = bomLineRepository.findByProjectId(project.getId())
                .stream()
                .map(this::toDto)
                .toList();
        Stream<BomLineDto> stream = allItems.stream();
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase();
            stream = stream.filter(item -> (item.code() != null && item.code().toLowerCase().contains(term)) ||
                    (item.name() != null && item.name().toLowerCase().contains(term)) ||
                    (item.category() != null && item.category().toLowerCase().contains(term)));
        }
        if (inStockOnly) {
            stream = stream.filter(item -> item.balanceQty() > 0);
        }
        List<BomLineDto> filtered = stream.toList();
        Page<BomLineDto> linesPage = new PageImpl<>(
                paginate(filtered, safePage, safeSize),
                PageRequest.of(safePage - 1, safeSize),
                filtered.size());
        return new PaginatedResponse<>(
                linesPage.getContent(),
                linesPage.getTotalElements(),
                Math.max(1, linesPage.getTotalPages()),
                linesPage.getSize(),
                linesPage.getNumber(),
                linesPage.hasNext(),
                linesPage.hasPrevious(),
                java.util.Collections.emptyMap());
    }

    private <T> List<T> paginate(List<T> items, int page, int size) {
        int fromIndex = Math.max(0, (page - 1) * size);
        int toIndex = Math.min(fromIndex + size, items.size());
        return fromIndex < toIndex ? items.subList(fromIndex, toIndex) : List.of();
    }

    public BomLine upsertLine(Project project, Material material, double quantity) {
        if (quantity < 0) {
            throw new BadRequestException("Quantity must be zero or greater");
        }
        BomLine line = bomLineRepository
                .findByProjectIdAndMaterialId(project.getId(), material.getId())
                .orElseGet(() -> {
                    BomLine created = new BomLine();
                    created.setProject(project);
                    created.setMaterial(material);
                    return created;
                });
        line.setQuantity(quantity);
        return bomLineRepository.save(line);
    }

    public void deleteLine(String projectId, String materialId) {
        Project project = requireProject(projectId);
        Material material = requireMaterial(materialId);
        bomLineRepository.deleteByProjectIdAndMaterialId(project.getId(), material.getId());
    }

    public List<AllocationOverviewDto> listAllocations(String search) {
        List<BomLine> lines = bomLineRepository.findAllWithProjectAndMaterial();
        Stream<BomLine> stream = lines.stream();
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase();
            stream = stream.filter(line -> {
                Project project = line.getProject();
                Material material = line.getMaterial();
                return (project != null && project.getName() != null && project.getName().toLowerCase().contains(term))
                        ||
                        (project != null && project.getCode() != null && project.getCode().toLowerCase().contains(term))
                        ||
                        (material != null && material.getName() != null
                                && material.getName().toLowerCase().contains(term))
                        ||
                        (material != null && material.getCode() != null
                                && material.getCode().toLowerCase().contains(term));
            });
        }
        return stream
                .map(line -> {
                    Project project = line.getProject();
                    Material material = line.getMaterial();
                    double quantity = line.getQuantity();
                    return new AllocationOverviewDto(
                            line.getId() != null ? String.valueOf(line.getId()) : null,
                            project != null && project.getId() != null ? String.valueOf(project.getId()) : null,
                            project != null ? project.getName() : null,
                            project != null ? project.getCode() : null,
                            material != null && material.getId() != null ? String.valueOf(material.getId()) : null,
                            material != null ? material.getName() : null,
                            material != null ? material.getCategory() : null,
                            quantity,
                            quantity,
                            material != null ? material.getUnit() : null);
                })
                .toList();
    }

    public double currentAllocation(Long projectId, Long materialId) {
        return bomLineRepository
                .findByProjectIdAndMaterialId(projectId, materialId)
                .map(BomLine::getQuantity)
                .orElse(0d);
    }

    public double currentAllocation(Project project, Material material) {
        if (project == null || material == null) {
            return 0d;
        }
        return currentAllocation(project.getId(), material.getId());
    }

    private Project requireProject(String id) {
        return projectRepository.findById(parseLong(id)).orElseThrow(() -> new NotFoundException("Project not found"));
    }

    private Material requireMaterial(String id) {
        return materialRepository.findById(parseLong(id))
                .orElseThrow(() -> new NotFoundException("Material not found"));
    }

    private Long parseLong(String value) {
        if (!StringUtils.hasText(value)) {
            throw new BadRequestException("Identifier is required");
        }
        return Long.parseLong(value);
    }

    private BomLineDto toDto(BomLine line) {
        Material material = line.getMaterial();
        Project project = line.getProject();
        double allocation = line.getQuantity();
        double orderedQty = safeDouble(
                inwardLineRepository.sumOrderedQtyByProjectAndMaterial(project.getId(), material.getId()));
        double receivedQty = safeDouble(
                inwardLineRepository.sumReceivedQtyByProjectAndMaterial(project.getId(), material.getId()));
        // returnedQty removed - RETURN type no longer supported
        double issuedQty = safeDouble(
                outwardLineRepository.sumIssuedQtyByProjectAndMaterial(project.getId(), material.getId()));
        double balanceQty = Math.max(0d, receivedQty - issuedQty);
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
                allocation,
                allocation,
                orderedQty,
                receivedQty,
                issuedQty,
                balanceQty);
    }

    private double safeDouble(Double value) {
        return value != null ? value : 0d;
    }
}
