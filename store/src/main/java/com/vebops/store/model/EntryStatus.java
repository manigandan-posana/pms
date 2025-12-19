package com.vebops.store.model;

public enum EntryStatus {
    OPEN("open"),
    CLOSED("closed");

    private final String displayName;

    EntryStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
