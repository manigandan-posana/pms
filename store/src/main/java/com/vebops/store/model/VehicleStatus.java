package com.vebops.store.model;

public enum VehicleStatus {
    ACTIVE("Active"),
    INACTIVE("Inactive"),
    PLANNED("Planned");

    private final String displayName;

    VehicleStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
