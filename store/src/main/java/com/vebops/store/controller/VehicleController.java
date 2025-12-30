package com.vebops.store.controller;

import com.vebops.store.dto.*;
import com.vebops.store.model.EntryStatus;
import com.vebops.store.model.FuelType;
import com.vebops.store.model.UserAccount;
import com.vebops.store.service.AppDataService;
import com.vebops.store.service.AuthService;
import com.vebops.store.service.FuelManagementService;
import com.vebops.store.service.VehicleService;
import com.vebops.store.util.AuthUtils;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private final VehicleService vehicleService;
    private final FuelManagementService fuelManagementService;
    private final AuthService authService;
    private final AppDataService appDataService;

    public VehicleController(
            VehicleService vehicleService,
            FuelManagementService fuelManagementService,
            AuthService authService,
            AppDataService appDataService) {
        this.vehicleService = vehicleService;
        this.fuelManagementService = fuelManagementService;
        this.authService = authService;
        this.appDataService = appDataService;
    }

    // Vehicle endpoints
    @GetMapping
    public ResponseEntity<List<VehicleDto>> getAllVehicles() {
        return ResponseEntity.ok(vehicleService.getAllVehicles());
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<VehicleDto>> getVehiclesByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(vehicleService.getVehiclesByProject(projectId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehicleDto> getVehicleById(@PathVariable Long id) {
        return ResponseEntity.ok(vehicleService.getVehicleById(id));
    }

    @PostMapping
    public ResponseEntity<?> createVehicle(@Valid @RequestBody CreateVehicleRequest request) {
        Long userId = AuthUtils.requireUserId();
        UserAccount user = authService.getUserById(userId);
        if (!appDataService.hasProjectAccess(user, request.getProjectId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(vehicleService.createVehicle(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VehicleDto> updateVehicle(
            @PathVariable Long id,
            @Valid @RequestBody CreateVehicleRequest request) {
        // ideally checking if user has access to request.getProjectId() is enough for
        // assignment,
        // but we might want to check existing project too. For now let's trust service
        // validaton + input check.
        Long userId = AuthUtils.requireUserId();
        UserAccount user = authService.getUserById(userId);
        if (!appDataService.hasProjectAccess(user, request.getProjectId())) {
            // return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            // Method signature says ResponseEntity<VehicleDto>, so build() might be type
            // mismatch if generics strict?
            // ResponseEntity.status(..).build() returns ResponseEntity<Void>.
            // Keep strictly typed or use <?>. The existing code used <VehicleDto>.
            // I'll change everything to <?> or throw RuntimeException.
            throw new com.vebops.store.exception.ForbiddenException("Access denied to this project");
        }
        return ResponseEntity.ok(vehicleService.updateVehicle(id, request));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<VehicleDto> updateVehicleStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateVehicleStatusRequest request) {
        return ResponseEntity.ok(vehicleService.updateVehicleStatus(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVehicle(@PathVariable Long id) {
        vehicleService.deleteVehicle(id);
        return ResponseEntity.noContent().build();
    }

    // Fuel entry endpoints
    @GetMapping("/fuel-entries")
    public ResponseEntity<List<FuelEntryDto>> getAllFuelEntries() {
        return ResponseEntity.ok(fuelManagementService.getAllFuelEntries());
    }

    @GetMapping("/fuel-entries/project/{projectId}")
    public ResponseEntity<List<FuelEntryDto>> getFuelEntriesByProject(
            @PathVariable Long projectId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) String fuelType,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        EntryStatus entryStatus = status != null ? EntryStatus.valueOf(status) : null;
        FuelType resolvedFuelType = fuelType != null ? FuelType.valueOf(fuelType) : null;
        return ResponseEntity.ok(
                fuelManagementService.searchFuelEntriesByProject(
                        projectId,
                        entryStatus,
                        vehicleId,
                        supplierId,
                        resolvedFuelType,
                        search,
                        startDate,
                        endDate));
    }

    @GetMapping("/fuel-entries/project/{projectId}/status/{status}")
    public ResponseEntity<List<FuelEntryDto>> getFuelEntriesByProjectAndStatus(
            @PathVariable Long projectId,
            @PathVariable String status) {
        return ResponseEntity.ok(fuelManagementService.getFuelEntriesByProjectAndStatus(projectId, status));
    }

    @GetMapping("/fuel-entries/project/{projectId}/range")
    public ResponseEntity<List<FuelEntryDto>> getFuelEntriesByDateRange(
            @PathVariable Long projectId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        return ResponseEntity.ok(fuelManagementService.getFuelEntriesByDateRange(projectId, startDate, endDate));
    }

    @GetMapping("/fuel-entries/{id}")
    public ResponseEntity<FuelEntryDto> getFuelEntryById(@PathVariable Long id) {
        return ResponseEntity.ok(fuelManagementService.getFuelEntryById(id));
    }

    @PostMapping("/fuel-entries")
    public ResponseEntity<?> createFuelEntry(@Valid @RequestBody CreateFuelEntryRequest request) {
        Long userId = AuthUtils.requireUserId();
        UserAccount user = authService.getUserById(userId);
        if (!appDataService.hasProjectAccess(user, request.getProjectId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(fuelManagementService.createFuelEntry(request));
    }

    @PutMapping("/fuel-entries/{id}/close")
    public ResponseEntity<FuelEntryDto> closeFuelEntry(
            @PathVariable Long id,
            @Valid @RequestBody CloseFuelEntryRequest request) {
        return ResponseEntity.ok(fuelManagementService.closeFuelEntry(id, request));
    }

    @DeleteMapping("/fuel-entries/{id}")
    public ResponseEntity<Void> deleteFuelEntry(@PathVariable Long id) {
        fuelManagementService.deleteFuelEntry(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/fuel-entries/refill")
    public ResponseEntity<?> refillFuelEntry(@Valid @RequestBody RefillRequest request) {
        Long userId = AuthUtils.requireUserId();
        UserAccount user = authService.getUserById(userId);
        if (!appDataService.hasProjectAccess(user, request.getProjectId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(fuelManagementService.refill(request));
    }

    // Supplier endpoints
    @GetMapping("/suppliers")
    public ResponseEntity<List<SupplierDto>> getAllSuppliers() {
        return ResponseEntity.ok(fuelManagementService.getAllSuppliers());
    }

    @GetMapping("/suppliers/project/{projectId}")
    public ResponseEntity<List<SupplierDto>> getSuppliersByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(fuelManagementService.getSuppliersByProject(projectId));
    }

    @PostMapping("/suppliers")
    public ResponseEntity<SupplierDto> createSupplier(@Valid @RequestBody CreateSupplierRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(fuelManagementService.createSupplier(request));
    }

    @DeleteMapping("/suppliers/{id}")
    public ResponseEntity<Void> deleteSupplier(@PathVariable Long id) {
        fuelManagementService.deleteSupplier(id);
        return ResponseEntity.noContent().build();
    }

    // Daily log endpoints
    @GetMapping("/daily-logs")
    public ResponseEntity<List<DailyLogDto>> getAllDailyLogs() {
        return ResponseEntity.ok(fuelManagementService.getAllDailyLogs());
    }

    @GetMapping("/daily-logs/project/{projectId}")
    public ResponseEntity<List<DailyLogDto>> getDailyLogsByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(fuelManagementService.getDailyLogsByProject(projectId));
    }

    @GetMapping("/daily-logs/project/{projectId}/date/{date}")
    public ResponseEntity<List<DailyLogDto>> getDailyLogsByProjectAndDate(
            @PathVariable Long projectId,
            @PathVariable LocalDate date) {
        return ResponseEntity.ok(fuelManagementService.getDailyLogsByProjectAndDate(projectId, date));
    }

    @PostMapping("/daily-logs")
    public ResponseEntity<?> createDailyLog(@Valid @RequestBody CreateDailyLogRequest request) {
        Long userId = AuthUtils.requireUserId();
        UserAccount user = authService.getUserById(userId);
        if (!appDataService.hasProjectAccess(user, request.getProjectId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(fuelManagementService.createDailyLog(request));
    }

    @PutMapping("/daily-logs/{id}/close")
    public ResponseEntity<DailyLogDto> closeDailyLog(
            @PathVariable Long id,
            @Valid @RequestBody CloseDailyLogRequest request) {
        return ResponseEntity.ok(fuelManagementService.closeDailyLog(id, request));
    }
}
