package com.vebops.store.repository;

import com.vebops.store.model.LabourUtilization;
import com.vebops.store.model.Labour;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface LabourUtilizationRepository extends JpaRepository<LabourUtilization, Long> {
    List<LabourUtilization> findByLabourInAndDateBetween(List<Labour> labours, LocalDate start, LocalDate end);
    List<LabourUtilization> findByLabour(Labour labour);
}
