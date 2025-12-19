package com.vebops.store.model;

public enum VehicleType {
    OWN_VEHICLE("Own Vehicle"),
    RENT_MONTHLY("Rent – Monthly"),
    RENT_DAILY("Rent – Daily"),
    RENT_HOURLY("Rent – Hourly");

    private final String displayName;

    VehicleType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
