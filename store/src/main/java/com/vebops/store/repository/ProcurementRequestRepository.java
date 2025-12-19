package com.vebops.store.repository;

import com.vebops.store.model.ProcurementRequest;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProcurementRequestRepository extends JpaRepository<ProcurementRequest, Long> {
    List<ProcurementRequest> findAllByOrderByCreatedAtDesc();

    List<ProcurementRequest> findByRequestedByIdOrderByCreatedAtDesc(Long userId);

    /**
     * Return a page of procurement requests, ordered by creation timestamp descending.
     * This method leverages Spring Data's {@link Pageable} abstraction to avoid
     * returning an unbounded list and includes an {@link EntityGraph} to fetch
     * relationships eagerly.
     *
     * @param pageable the pagination information
     * @return a page of procurement requests
     */
    @EntityGraph(attributePaths = {"project", "material", "requestedBy", "resolvedBy"})
    Page<ProcurementRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /**
     * Return a page of procurement requests created by the given user, ordered by
     * creation timestamp descending.  This overload supports pagination.
     *
     * @param userId the id of the requesting user
     * @param pageable the pagination information
     * @return a page of procurement requests for the user
     */
    @EntityGraph(attributePaths = {"project", "material", "requestedBy", "resolvedBy"})
    Page<ProcurementRequest> findByRequestedByIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
