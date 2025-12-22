package com.vebops.store.controller;

import com.vebops.store.dto.*;
import com.vebops.store.service.VehicleService;
import com.vebops.store.service.FuelManagementService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private final VehicleService vehicleService;
    private final FuelManagementService fuelManagementService;

    public VehicleController(VehicleService vehicleService, FuelManagementService fuelManagementService) {
        this.vehicleService = vehicleService;
        this.fuelManagementService = fuelManagementService;
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
    public ResponseEntity<VehicleDto> createVehicle(@Valid @RequestBody CreateVehicleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(vehicleService.createVehicle(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VehicleDto> updateVehicle(
            @PathVariable Long id,
            @Valid @RequestBody CreateVehicleRequest request) {
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
    public ResponseEntity<List<FuelEntryDto>> getFuelEntriesByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(fuelManagementService.getFuelEntriesByProject(projectId));
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
    public ResponseEntity<FuelEntryDto> createFuelEntry(@Valid @RequestBody CreateFuelEntryRequest request) {
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
    public ResponseEntity<FuelEntryDto> refillFuelEntry(@Valid @RequestBody RefillRequest request) {
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
    public ResponseEntity<DailyLogDto> createDailyLog(@Valid @RequestBody CreateDailyLogRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(fuelManagementService.createDailyLog(request));
    }

    @PutMapping("/daily-logs/{id}/close")
    public ResponseEntity<DailyLogDto> closeDailyLog(
            @PathVariable Long id,
            @Valid @RequestBody CloseDailyLogRequest request) {
        return ResponseEntity.ok(fuelManagementService.closeDailyLog(id, request));
    }
}
