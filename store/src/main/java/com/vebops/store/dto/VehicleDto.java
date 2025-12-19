package com.vebops.store.dto;

import com.vebops.store.model.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class VehicleDto {
    private Long id;
    private Long projectId;
    private String projectCode;
    private String projectName;
    private String vehicleName;
    private String vehicleNumber;
    private String vehicleType;
    private String fuelType;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private Double rentPrice;
    private String rentPeriod;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<StatusHistoryDto> statusHistory;

    public static VehicleDto fromEntity(Vehicle vehicle) {
        VehicleDto dto = new VehicleDto();
        dto.setId(vehicle.getId());
        dto.setProjectId(vehicle.getProject().getId());
        dto.setProjectCode(vehicle.getProject().getCode());
        dto.setProjectName(vehicle.getProject().getName());
        dto.setVehicleName(vehicle.getVehicleName());
        dto.setVehicleNumber(vehicle.getVehicleNumber());
        dto.setVehicleType(vehicle.getVehicleType().name());
        dto.setFuelType(vehicle.getFuelType().name());
        dto.setStatus(vehicle.getStatus().name());
        dto.setStartDate(vehicle.getStartDate());
        dto.setEndDate(vehicle.getEndDate());
        dto.setRentPrice(vehicle.getRentPrice());
        dto.setRentPeriod(vehicle.getRentPeriod() != null ? vehicle.getRentPeriod().name() : null);
        dto.setCreatedAt(vehicle.getCreatedAt());
        dto.setUpdatedAt(vehicle.getUpdatedAt());
        return dto;
    }

    public static class StatusHistoryDto {
        private Long id;
        private String status;
        private LocalDate startDate;
        private LocalDate endDate;
        private String reason;

        // Getters and Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public LocalDate getStartDate() { return startDate; }
        public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
        public LocalDate getEndDate() { return endDate; }
        public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getProjectCode() { return projectCode; }
    public void setProjectCode(String projectCode) { this.projectCode = projectCode; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public String getVehicleName() { return vehicleName; }
    public void setVehicleName(String vehicleName) { this.vehicleName = vehicleName; }
    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }
    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }
    public String getFuelType() { return fuelType; }
    public void setFuelType(String fuelType) { this.fuelType = fuelType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public Double getRentPrice() { return rentPrice; }
    public void setRentPrice(Double rentPrice) { this.rentPrice = rentPrice; }
    public String getRentPeriod() { return rentPeriod; }
    public void setRentPeriod(String rentPeriod) { this.rentPeriod = rentPeriod; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public List<StatusHistoryDto> getStatusHistory() { return statusHistory; }
    public void setStatusHistory(List<StatusHistoryDto> statusHistory) { this.statusHistory = statusHistory; }
}
