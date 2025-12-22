package com.vebops.store.dto;

import jakarta.validation.constraints.NotNull;
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
}
