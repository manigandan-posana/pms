package com.vebops.store.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDate;

public class RefillRequest {
    @NotNull(message = "Date is required")
    private LocalDate date;

    @NotNull(message = "Project ID is required")
    private Long projectId;

    @NotNull(message = "Vehicle ID is required")
    private Long vehicleId;

    @NotNull(message = "Opening km is required")
    private Double openingKm;

    // Optional photo
    private String openingKmPhoto;

    // Refill fuel details
    @NotNull(message = "Supplier ID is required")
    private Long supplierId;

    @NotNull(message = "Litres is required")
    @Positive(message = "Litres must be positive")
    private Double litres;

    @NotNull(message = "Price per litre is required")
    @Positive(message = "Price per litre must be positive")
    private Double pricePerLitre;

    // Getters and Setters
    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public Long getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
    }

    public Double getOpeningKm() {
        return openingKm;
    }

    public void setOpeningKm(Double openingKm) {
        this.openingKm = openingKm;
    }

    public String getOpeningKmPhoto() {
        return openingKmPhoto;
    }

    public void setOpeningKmPhoto(String openingKmPhoto) {
        this.openingKmPhoto = openingKmPhoto;
    }

    public Long getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Long supplierId) {
        this.supplierId = supplierId;
    }

    public Double getLitres() {
        return litres;
    }

    public void setLitres(Double litres) {
        this.litres = litres;
    }

    public Double getPricePerLitre() {
        return pricePerLitre;
    }

    public void setPricePerLitre(Double pricePerLitre) {
        this.pricePerLitre = pricePerLitre;
    }
}
