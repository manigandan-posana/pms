package com.vebops.store.model;

/**
 * Fine-grained permissions that can be attached to non-admin users.
 * Admin users implicitly have all permissions.
 */
public enum Permission {
    ADMIN_ACCESS,
    USER_MANAGEMENT,
    PROJECT_MANAGEMENT,
    MATERIAL_MANAGEMENT,
    MATERIAL_ALLOCATION,
    ALLOCATED_MATERIALS_VIEW,
    INVENTORY_OPERATIONS,
    VEHICLE_MANAGEMENT
}
