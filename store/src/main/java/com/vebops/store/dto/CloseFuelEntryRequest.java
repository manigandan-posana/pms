package com.vebops.store.dto;

import jakarta.validation.constraints.NotNull;

public class CloseFuelEntryRequest {
    @NotNull(message = "Closing km is required")
    private Double closingKm;

    private String closingKmPhoto;

    // Getters and Setters
    public Double getClosingKm() { return closingKm; }
    public void setClosingKm(Double closingKm) { this.closingKm = closingKm; }
    public String getClosingKmPhoto() { return closingKmPhoto; }
    public void setClosingKmPhoto(String closingKmPhoto) { this.closingKmPhoto = closingKmPhoto; }
}
