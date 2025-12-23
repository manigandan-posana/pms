package com.vebops.store.repository;

import com.vebops.store.model.FuelEntry;
import com.vebops.store.model.EntryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface FuelEntryRepository extends JpaRepository<FuelEntry, Long>, JpaSpecificationExecutor<FuelEntry> {
    List<FuelEntry> findByProjectId(Long projectId);
    List<FuelEntry> findByVehicleId(Long vehicleId);
    List<FuelEntry> findByProjectIdAndStatus(Long projectId, EntryStatus status);
    List<FuelEntry> findByProjectIdAndDateBetween(Long projectId, LocalDate startDate, LocalDate endDate);
}
