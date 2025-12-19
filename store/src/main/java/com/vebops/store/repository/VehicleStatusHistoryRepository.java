package com.vebops.store.repository;

import com.vebops.store.model.VehicleStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VehicleStatusHistoryRepository extends JpaRepository<VehicleStatusHistory, Long> {
    List<VehicleStatusHistory> findByVehicleIdOrderByStartDateDesc(Long vehicleId);
}
