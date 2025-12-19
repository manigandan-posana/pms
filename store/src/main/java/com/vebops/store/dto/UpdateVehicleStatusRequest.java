package com.vebops.store.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class UpdateVehicleStatusRequest {
    @NotBlank(message = "Status is required")
    private String status;

    @NotNull(message = "Status change date is required")
    private LocalDate statusChangeDate;

    @NotBlank(message = "Reason is required")
    private String reason;

    // Getters and Setters
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDate getStatusChangeDate() { return statusChangeDate; }
    public void setStatusChangeDate(LocalDate statusChangeDate) { this.statusChangeDate = statusChangeDate; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
