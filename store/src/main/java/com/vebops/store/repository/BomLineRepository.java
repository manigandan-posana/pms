package com.vebops.store.repository;

import com.vebops.store.model.BomLine;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface BomLineRepository extends JpaRepository<BomLine, Long> {
    @EntityGraph(attributePaths = {"material", "project"})
    List<BomLine> findByProjectId(Long projectId);

    /**
     * Return a paginated list of bill of materials lines for the given project. This
     * overload accepts a {@link Pageable} to allow clients to request a subset of
     * lines and provides eager fetching of the associated material and project
     * references via {@link EntityGraph}. Without the entity graph, accessing
     * material or project fields on the returned entities could result in N+1
     * select issues.
     *
     * @param projectId the id of the project whose BOM lines are requested
     * @param pageable pagination information, including zero‑based page index and size
     * @return a page of BOM lines for the specified project
     */
    @EntityGraph(attributePaths = {"material", "project"})
    Page<BomLine> findByProjectId(Long projectId, Pageable pageable);

    Optional<BomLine> findByProjectIdAndMaterialId(Long projectId, Long materialId);

    void deleteByProjectIdAndMaterialId(Long projectId, Long materialId);

    @Query("select distinct b.project.id from BomLine b where b.project.id is not null")
    Set<Long> projectIdsWithAllocations();

    @Query("select b.material.id from BomLine b where b.project.id = :projectId and b.material.id is not null")
    Set<Long> materialIdsForProject(Long projectId);

    @EntityGraph(attributePaths = {"material", "project"})
    @Query("select b from BomLine b")
    List<BomLine> findAllWithProjectAndMaterial();
}
