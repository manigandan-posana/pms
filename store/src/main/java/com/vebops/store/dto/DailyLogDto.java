package com.vebops.store.dto;

import com.vebops.store.model.DailyLog;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class DailyLogDto {
    private Long id;
    private LocalDate date;
    private Long projectId;
    private String projectCode;
    private Long vehicleId;
    private String vehicleName;
    private String vehicleNumber;
    private Double openingKm;
    private Double closingKm;
    private Double distance;
    private String status;
    private String openingKmPhoto;
    private String closingKmPhoto;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static DailyLogDto fromEntity(DailyLog log) {
        DailyLogDto dto = new DailyLogDto();
        dto.setId(log.getId());
        dto.setDate(log.getDate());
        dto.setProjectId(log.getProject().getId());
        dto.setProjectCode(log.getProject().getCode());
        dto.setVehicleId(log.getVehicle().getId());
        dto.setVehicleName(log.getVehicle().getVehicleName());
        dto.setVehicleNumber(log.getVehicle().getVehicleNumber());
        dto.setOpeningKm(log.getOpeningKm());
        dto.setClosingKm(log.getClosingKm());
        dto.setDistance(log.getDistance());
        dto.setStatus(log.getStatus().name());
        dto.setOpeningKmPhoto(log.getOpeningKmPhoto());
        dto.setClosingKmPhoto(log.getClosingKmPhoto());
        dto.setCreatedAt(log.getCreatedAt());
        dto.setUpdatedAt(log.getUpdatedAt());
        return dto;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getProjectCode() { return projectCode; }
    public void setProjectCode(String projectCode) { this.projectCode = projectCode; }
    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }
    public String getVehicleName() { return vehicleName; }
    public void setVehicleName(String vehicleName) { this.vehicleName = vehicleName; }
    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }
    public Double getOpeningKm() { return openingKm; }
    public void setOpeningKm(Double openingKm) { this.openingKm = openingKm; }
    public Double getClosingKm() { return closingKm; }
    public void setClosingKm(Double closingKm) { this.closingKm = closingKm; }
    public Double getDistance() { return distance; }
    public void setDistance(Double distance) { this.distance = distance; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getOpeningKmPhoto() { return openingKmPhoto; }
    public void setOpeningKmPhoto(String openingKmPhoto) { this.openingKmPhoto = openingKmPhoto; }
    public String getClosingKmPhoto() { return closingKmPhoto; }
    public void setClosingKmPhoto(String closingKmPhoto) { this.closingKmPhoto = closingKmPhoto; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
