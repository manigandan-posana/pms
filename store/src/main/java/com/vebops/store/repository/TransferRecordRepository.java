package com.vebops.store.repository;

import com.vebops.store.model.TransferRecord;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransferRecordRepository extends JpaRepository<TransferRecord, Long> {
    @EntityGraph(attributePaths = {"fromProject", "toProject", "lines", "lines.material"})
    Optional<TransferRecord> findWithLinesById(Long id);
    
    @EntityGraph(attributePaths = {"fromProject", "toProject", "lines", "lines.material"})
    List<TransferRecord> findAllByOrderByTransferDateDesc();

    long countByTransferDate(LocalDate transferDate);

    /**
     * Return a page of transfer records ordered by transfer date descending. This
     * overload supports pagination using Spring Data's {@link Pageable}
     * abstraction. An {@link EntityGraph} is used to eagerly fetch related
     * entities.
     *
     * @param pageable the pagination information
     * @return a page of transfer records
     */
    @EntityGraph(attributePaths = {"fromProject", "toProject", "lines", "lines.material"})
    Page<TransferRecord> findAllByOrderByTransferDateDesc(Pageable pageable);

    /**
     * Return a page of transfer records where either the fromProject or toProject id
     * is contained in the provided {@code projectIds} set. Records are ordered by
     * transfer date descending. An {@link EntityGraph} is used to eagerly fetch
     * associated entities.
     *
     * @param projectIds the set of allowed project ids
     * @param pageable   the pagination information
     * @return a page of transfer records matching the allowed projects
     */
    @EntityGraph(attributePaths = {"fromProject", "toProject", "lines", "lines.material"})
    Page<TransferRecord> findByFromProjectIdInOrToProjectIdInOrderByTransferDateDesc(Set<Long> projectIds, Set<Long> projectIds2, Pageable pageable);
}
