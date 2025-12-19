package com.vebops.store.repository;

import com.vebops.store.model.InwardRecord;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InwardRecordRepository extends JpaRepository<InwardRecord, Long> {
    @EntityGraph(attributePaths = {"project", "lines", "lines.material"})
    List<InwardRecord> findAllByOrderByEntryDateDesc();

    @EntityGraph(attributePaths = {"project", "lines", "lines.material"})
    List<InwardRecord> findByLinesMaterialIdOrderByEntryDateDesc(Long materialId);

    /**
     * Return a page of inward records ordered by entry date descending. This method
     * leverages Spring Data's {@link Pageable} abstraction to avoid returning an
     * unbounded list and includes an {@link EntityGraph} to fetch relationships
     * eagerly.
     *
     * @param pageable the pagination information
     * @return a page of inward records
     */
    @EntityGraph(attributePaths = {"project", "lines", "lines.material"})
    Page<InwardRecord> findAllByOrderByEntryDateDesc(Pageable pageable);

    /**
     * Return a page of inward records filtered by material id, ordered by entry
     * date descending. This method supports pagination.
     *
     * @param materialId the id of the material to filter by
     * @param pageable   the pagination information
     * @return a page of inward records for the specified material
     */
    @EntityGraph(attributePaths = {"project", "lines", "lines.material"})
    Page<InwardRecord> findByLinesMaterialIdOrderByEntryDateDesc(Long materialId, Pageable pageable);

    /**
     * Return a page of inward records for a set of project ids ordered by entry date descending.
     * This query restricts results to only records whose project id is contained in the provided
     * {@code projectIds} set. If {@code projectIds} is empty, an empty page will be returned.
     * An {@link EntityGraph} is used to eagerly fetch the project and lines to avoid N+1 issues.
     *
     * @param projectIds the set of allowed project ids to filter by
     * @param pageable the pagination information
     * @return a page of inward records matching the allowed projects
     */
    @EntityGraph(attributePaths = {"project", "lines", "lines.material"})
    Page<InwardRecord> findByProjectIdInOrderByEntryDateDesc(Set<Long> projectIds, Pageable pageable);

    /**
     * Find a single inward record by ID with all relationships eagerly loaded.
     * This method uses EntityGraph to fetch project, lines, and materials in a single query.
     *
     * @param id the id of the inward record
     * @return the inward record with all relationships loaded
     */
    @EntityGraph(attributePaths = {"project", "lines", "lines.material"})
    java.util.Optional<InwardRecord> findWithLinesById(Long id);

    long countByEntryDate(LocalDate entryDate);
}
