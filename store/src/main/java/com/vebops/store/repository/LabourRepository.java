package com.vebops.store.repository;

import com.vebops.store.model.Labour;
import com.vebops.store.model.Contractor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LabourRepository extends JpaRepository<Labour, Long> {
    Optional<Labour> findByCode(String code);
    List<Labour> findByContractor(Contractor contractor);
}
