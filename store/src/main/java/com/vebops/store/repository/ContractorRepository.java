package com.vebops.store.repository;

import com.vebops.store.model.Contractor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ContractorRepository extends JpaRepository<Contractor, Long> {
    Optional<Contractor> findByCode(String code);

    java.util.List<Contractor> findByProjectsId(Long projectId);
}
