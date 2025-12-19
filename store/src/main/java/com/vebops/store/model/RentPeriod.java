package com.vebops.store.model;

public enum RentPeriod {
    MONTHLY("monthly"),
    DAILY("daily"),
    HOURLY("hourly");

    private final String displayName;

    RentPeriod(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
