package com.vebops.store.dto;

import com.vebops.store.model.FuelEntry;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class FuelEntryDto {
    private Long id;
    private LocalDate date;
    private Long projectId;
    private String projectCode;
    private Long vehicleId;
    private String vehicleName;
    private String vehicleNumber;
    private String fuelType;
    private Long supplierId;
    private String supplierName;
    private Double litres;
    private Double openingKm;
    private Double closingKm;
    private Double distance;
    private Double mileage;
    private String status;
    private String openingKmPhoto;
    private String closingKmPhoto;
    private Double pricePerLitre;
    private Double totalCost;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static FuelEntryDto fromEntity(FuelEntry entry) {
        FuelEntryDto dto = new FuelEntryDto();
        dto.setId(entry.getId());
        dto.setDate(entry.getDate());
        dto.setProjectId(entry.getProject().getId());
        dto.setProjectCode(entry.getProject().getCode());
        dto.setVehicleId(entry.getVehicle().getId());
        dto.setVehicleName(entry.getVehicle().getVehicleName());
        dto.setVehicleNumber(entry.getVehicle().getVehicleNumber());
        dto.setFuelType(entry.getFuelType().name());
        dto.setSupplierId(entry.getSupplier().getId());
        dto.setSupplierName(entry.getSupplier().getSupplierName());
        dto.setLitres(entry.getLitres());
        dto.setOpeningKm(entry.getOpeningKm());
        dto.setClosingKm(entry.getClosingKm());
        dto.setDistance(entry.getDistance());
        dto.setMileage(entry.getMileage());
        dto.setStatus(entry.getStatus().name());
        dto.setOpeningKmPhoto(entry.getOpeningKmPhoto());
        dto.setClosingKmPhoto(entry.getClosingKmPhoto());
        dto.setPricePerLitre(entry.getPricePerLitre());
        dto.setTotalCost(entry.getTotalCost());
        dto.setCreatedAt(entry.getCreatedAt());
        dto.setUpdatedAt(entry.getUpdatedAt());
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
    public String getFuelType() { return fuelType; }
    public void setFuelType(String fuelType) { this.fuelType = fuelType; }
    public Long getSupplierId() { return supplierId; }
    public void setSupplierId(Long supplierId) { this.supplierId = supplierId; }
    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }
    public Double getLitres() { return litres; }
    public void setLitres(Double litres) { this.litres = litres; }
    public Double getOpeningKm() { return openingKm; }
    public void setOpeningKm(Double openingKm) { this.openingKm = openingKm; }
    public Double getClosingKm() { return closingKm; }
    public void setClosingKm(Double closingKm) { this.closingKm = closingKm; }
    public Double getDistance() { return distance; }
    public void setDistance(Double distance) { this.distance = distance; }
    public Double getMileage() { return mileage; }
    public void setMileage(Double mileage) { this.mileage = mileage; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getOpeningKmPhoto() { return openingKmPhoto; }
    public void setOpeningKmPhoto(String openingKmPhoto) { this.openingKmPhoto = openingKmPhoto; }
    public String getClosingKmPhoto() { return closingKmPhoto; }
    public void setClosingKmPhoto(String closingKmPhoto) { this.closingKmPhoto = closingKmPhoto; }
    public Double getPricePerLitre() { return pricePerLitre; }
    public void setPricePerLitre(Double pricePerLitre) { this.pricePerLitre = pricePerLitre; }
    public Double getTotalCost() { return totalCost; }
    public void setTotalCost(Double totalCost) { this.totalCost = totalCost; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
