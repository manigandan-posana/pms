package com.vebops.store.repository;

import com.vebops.store.model.DailyLog;
import com.vebops.store.model.EntryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyLogRepository extends JpaRepository<DailyLog, Long> {
    List<DailyLog> findByProjectId(Long projectId);
    List<DailyLog> findByVehicleId(Long vehicleId);
    List<DailyLog> findByProjectIdAndDate(Long projectId, LocalDate date);
    Optional<DailyLog> findByVehicleIdAndDateAndStatus(Long vehicleId, LocalDate date, EntryStatus status);
}
