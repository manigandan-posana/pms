package com.vebops.store.repository;

import com.vebops.store.model.OutwardRecord;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OutwardRecordRepository extends JpaRepository<OutwardRecord, Long> {
    @EntityGraph(attributePaths = { "project", "lines", "lines.material" })
    List<OutwardRecord> findAllByOrderByEntryDateDesc();

    @EntityGraph(attributePaths = { "project", "lines", "lines.material" })
    List<OutwardRecord> findByLinesMaterialIdOrderByEntryDateDesc(Long materialId);

    /**
     * Return a page of outward records ordered by entry date descending. This
     * method
     * leverages Spring Data's {@link Pageable} abstraction to avoid returning an
     * unbounded list and includes an {@link EntityGraph} to fetch relationships
     * eagerly.
     *
     * @param pageable the pagination information
     * @return a page of outward records
     */
    @EntityGraph(attributePaths = { "project", "lines", "lines.material" })
    Page<OutwardRecord> findAllByOrderByEntryDateDesc(Pageable pageable);

    /**
     * Return a page of outward records filtered by material id, ordered by entry
     * date descending. This method supports pagination.
     *
     * @param materialId the id of the material to filter by
     * @param pageable   the pagination information
     * @return a page of outward records for the specified material
     */
    @EntityGraph(attributePaths = { "project", "lines", "lines.material" })
    Page<OutwardRecord> findByLinesMaterialIdOrderByEntryDateDesc(Long materialId, Pageable pageable);

    /**
     * Return a page of outward records for a set of project ids ordered by entry
     * date descending.
     * This query restricts results to only records whose project id is contained in
     * the provided
     * {@code projectIds} set. If {@code projectIds} is empty, an empty page will be
     * returned.
     * An {@link EntityGraph} is used to eagerly fetch the project and lines to
     * avoid N+1 issues.
     *
     * @param projectIds the set of allowed project ids to filter by
     * @param pageable   the pagination information
     * @return a page of outward records matching the allowed projects
     */
    @EntityGraph(attributePaths = { "project", "lines", "lines.material" })
    Page<OutwardRecord> findByProjectIdInOrderByEntryDateDesc(Set<Long> projectIds, Pageable pageable);

    /**
     * Find a single outward record by ID with all relationships eagerly loaded.
     * This method uses EntityGraph to fetch project, lines, and materials in a
     * single query.
     *
     * @param id the id of the outward record
     * @return the outward record with all relationships loaded
     */
    @EntityGraph(attributePaths = { "project", "lines", "lines.material" })
    java.util.Optional<OutwardRecord> findWithLinesById(Long id);

    /**
     * Count outward records by entry date for code generation.
     */
    long countByEntryDate(LocalDate entryDate);

    @EntityGraph(attributePaths = { "project", "lines", "lines.material" })
    List<OutwardRecord> findByProjectIdOrderByEntryDateDesc(Long projectId);
}
