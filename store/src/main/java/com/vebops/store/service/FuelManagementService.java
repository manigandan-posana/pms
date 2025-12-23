package com.vebops.store.service;

import com.vebops.store.dto.*;
import com.vebops.store.exception.BadRequestException;
import com.vebops.store.exception.NotFoundException;
import com.vebops.store.model.*;
import com.vebops.store.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FuelManagementService {

    private final FuelEntryRepository fuelEntryRepository;
    private final VehicleRepository vehicleRepository;
    private final ProjectRepository projectRepository;
    private final SupplierRepository supplierRepository;
    private final DailyLogRepository dailyLogRepository;

    public FuelManagementService(
            FuelEntryRepository fuelEntryRepository,
            VehicleRepository vehicleRepository,
            ProjectRepository projectRepository,
            SupplierRepository supplierRepository,
            DailyLogRepository dailyLogRepository) {
        this.fuelEntryRepository = fuelEntryRepository;
        this.vehicleRepository = vehicleRepository;
        this.projectRepository = projectRepository;
        this.supplierRepository = supplierRepository;
        this.dailyLogRepository = dailyLogRepository;
    }

    public List<FuelEntryDto> getAllFuelEntries() {
        return fuelEntryRepository.findAll().stream()
                .map(FuelEntryDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<FuelEntryDto> getFuelEntriesByProject(Long projectId) {
        return fuelEntryRepository.findByProjectId(projectId).stream()
                .map(FuelEntryDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<FuelEntryDto> getFuelEntriesByProjectAndStatus(Long projectId, String status) {
        EntryStatus entryStatus = EntryStatus.valueOf(status);
        return fuelEntryRepository.findByProjectIdAndStatus(projectId, entryStatus).stream()
                .map(FuelEntryDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<FuelEntryDto> getFuelEntriesByDateRange(Long projectId, LocalDate startDate, LocalDate endDate) {
        return fuelEntryRepository.findByProjectIdAndDateBetween(projectId, startDate, endDate).stream()
                .map(FuelEntryDto::fromEntity)
                .collect(Collectors.toList());
    }

    public FuelEntryDto getFuelEntryById(Long id) {
        FuelEntry entry = fuelEntryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Fuel entry not found with id: " + id));
        return FuelEntryDto.fromEntity(entry);
    }

    @Transactional
    public FuelEntryDto createFuelEntry(CreateFuelEntryRequest request) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new NotFoundException("Project not found with id: " + request.getProjectId()));

        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new NotFoundException("Vehicle not found with id: " + request.getVehicleId()));

        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new NotFoundException("Supplier not found with id: " + request.getSupplierId()));

        // Check if there's an open daily log for this vehicle
        List<DailyLog> vehicleDailyLogs = dailyLogRepository.findByVehicleId(request.getVehicleId());
        boolean hasOpenDailyLog = vehicleDailyLogs.stream()
                .anyMatch(log -> log.getStatus() == EntryStatus.OPEN);

        if (hasOpenDailyLog) {
            throw new BadRequestException("Cannot create fuel entry. Please close the open daily log first.");
        }

        // Get the last closed daily log's closing KM
        Double lastDailyLogClosingKm = vehicleDailyLogs.stream()
                .filter(log -> log.getStatus() == EntryStatus.CLOSED && log.getClosingKm() != null)
                .max((a, b) -> a.getDate().compareTo(b.getDate()))
                .map(DailyLog::getClosingKm)
                .orElse(null);

        // Get the last closed fuel entry's closing KM
        List<FuelEntry> vehicleFuelEntries = fuelEntryRepository.findByVehicleId(request.getVehicleId());
        Double lastFuelEntryClosingKm = vehicleFuelEntries.stream()
                .filter(entry -> entry.getStatus() == EntryStatus.CLOSED && entry.getClosingKm() != null)
                .max((a, b) -> a.getDate().compareTo(b.getDate()))
                .map(FuelEntry::getClosingKm)
                .orElse(null);

        // Determine the maximum closing KM from both sources
        Double maxClosingKm = null;
        String source = "";

        if (lastDailyLogClosingKm != null && lastFuelEntryClosingKm != null) {
            if (lastDailyLogClosingKm >= lastFuelEntryClosingKm) {
                maxClosingKm = lastDailyLogClosingKm;
                source = "daily log";
            } else {
                maxClosingKm = lastFuelEntryClosingKm;
                source = "fuel entry";
            }
        } else if (lastDailyLogClosingKm != null) {
            maxClosingKm = lastDailyLogClosingKm;
            source = "daily log";
        } else if (lastFuelEntryClosingKm != null) {
            maxClosingKm = lastFuelEntryClosingKm;
            source = "fuel entry";
        }

        if (maxClosingKm != null && request.getOpeningKm() < maxClosingKm) {
            throw new BadRequestException(
                    String.format("Fuel opening KM (%.1f) must be greater than or equal to last %s closing KM (%.1f)",
                            request.getOpeningKm(), source, maxClosingKm));
        }

        FuelEntry entry = new FuelEntry();
        entry.setDate(request.getDate());
        entry.setProject(project);
        entry.setVehicle(vehicle);
        entry.setFuelType(vehicle.getFuelType());
        entry.setSupplier(supplier);
        entry.setLitres(request.getLitres());
        entry.setOpeningKm(request.getOpeningKm());
        entry.setOpeningKmPhoto(request.getOpeningKmPhoto());
        entry.setPricePerLitre(request.getPricePerLitre());
        entry.setTotalCost(request.getLitres() * request.getPricePerLitre());
        entry.setStatus(EntryStatus.OPEN);

        FuelEntry saved = fuelEntryRepository.save(entry);
        return FuelEntryDto.fromEntity(saved);
    }

    @Transactional
    public FuelEntryDto closeFuelEntry(Long id, CloseFuelEntryRequest request) {
        FuelEntry entry = fuelEntryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Fuel entry not found with id: " + id));

        if (entry.getStatus() == EntryStatus.CLOSED) {
            throw new BadRequestException("Fuel entry is already closed");
        }

        if (request.getClosingKm() < entry.getOpeningKm()) {
            throw new BadRequestException("Closing km cannot be less than opening km");
        }

        // Check if closing km is valid compared to last closed daily log
        List<DailyLog> vehicleDailyLogs = dailyLogRepository.findByVehicleId(entry.getVehicle().getId());
        DailyLog lastClosedLog = vehicleDailyLogs.stream()
                .filter(log -> log.getStatus() == EntryStatus.CLOSED && log.getClosingKm() != null)
                .max((a, b) -> a.getDate().compareTo(b.getDate()))
                .orElse(null);

        if (lastClosedLog != null && request.getClosingKm() < lastClosedLog.getClosingKm()) {
            throw new BadRequestException(
                    String.format(
                            "Fuel closing KM (%.1f) must be greater than or equal to last daily log closing KM (%.1f)",
                            request.getClosingKm(), lastClosedLog.getClosingKm()));
        }

        entry.setClosingKm(request.getClosingKm());
        entry.setClosingKmPhoto(request.getClosingKmPhoto());
        entry.setDistance(request.getClosingKm() - entry.getOpeningKm());
        entry.setMileage(entry.getDistance() / entry.getLitres());
        entry.setStatus(EntryStatus.CLOSED);

        FuelEntry saved = fuelEntryRepository.save(entry);
        return FuelEntryDto.fromEntity(saved);
    }

    @Transactional
    public void deleteFuelEntry(Long id) {
        FuelEntry entry = fuelEntryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Fuel entry not found with id: " + id));
        fuelEntryRepository.delete(entry);
    }

    // Supplier methods
    public List<SupplierDto> getAllSuppliers() {
        return supplierRepository.findAll().stream()
                .map(SupplierDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<SupplierDto> getSuppliersByProject(Long projectId) {
        return supplierRepository.findByProjectId(projectId).stream()
                .map(SupplierDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public SupplierDto createSupplier(CreateSupplierRequest request) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new NotFoundException("Project not found with id: " + request.getProjectId()));

        Supplier supplier = new Supplier();
        supplier.setProject(project);
        supplier.setSupplierName(request.getSupplierName());
        supplier.setContactPerson(request.getContactPerson());
        supplier.setPhoneNumber(request.getPhoneNumber());
        supplier.setAddress(request.getAddress());

        Supplier saved = supplierRepository.save(supplier);
        return SupplierDto.fromEntity(saved);
    }

    @Transactional
    public void deleteSupplier(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Supplier not found with id: " + id));
        supplierRepository.delete(supplier);
    }

    // Daily Log methods
    public List<DailyLogDto> getAllDailyLogs() {
        return dailyLogRepository.findAll().stream()
                .map(DailyLogDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<DailyLogDto> getDailyLogsByProject(Long projectId) {
        return dailyLogRepository.findByProjectId(projectId).stream()
                .map(DailyLogDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<DailyLogDto> getDailyLogsByProjectAndDate(Long projectId, LocalDate date) {
        return dailyLogRepository.findByProjectIdAndDate(projectId, date).stream()
                .map(DailyLogDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public DailyLogDto createDailyLog(CreateDailyLogRequest request) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new NotFoundException("Project not found with id: " + request.getProjectId()));

        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new NotFoundException("Vehicle not found with id: " + request.getVehicleId()));

        // Check if there's already an open log for this vehicle today
        dailyLogRepository.findByVehicleIdAndDateAndStatus(
                request.getVehicleId(), request.getDate(), EntryStatus.OPEN).ifPresent(log -> {
                    throw new BadRequestException("There is already an open daily log for this vehicle today");
                });

        DailyLog log = new DailyLog();
        log.setDate(request.getDate());
        log.setProject(project);
        log.setVehicle(vehicle);
        log.setOpeningKm(request.getOpeningKm());
        log.setOpeningKmPhoto(request.getOpeningKmPhoto());
        log.setStatus(EntryStatus.OPEN);

        DailyLog saved = dailyLogRepository.save(log);
        return DailyLogDto.fromEntity(saved);
    }

    @Transactional
    public DailyLogDto closeDailyLog(Long id, CloseDailyLogRequest request) {
        DailyLog log = dailyLogRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Daily log not found with id: " + id));

        if (log.getStatus() == EntryStatus.CLOSED) {
            throw new BadRequestException("Daily log is already closed");
        }

        if (request.getClosingKm() < log.getOpeningKm()) {
            throw new BadRequestException("Closing km cannot be less than opening km");
        }

        log.setClosingKm(request.getClosingKm());
        log.setClosingKmPhoto(request.getClosingKmPhoto());
        log.setDistance(request.getClosingKm() - log.getOpeningKm());
        log.setStatus(EntryStatus.CLOSED);

        DailyLog saved = dailyLogRepository.save(log);
        return DailyLogDto.fromEntity(saved);
    }

    @Transactional
    public FuelEntryDto refill(RefillRequest request) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new NotFoundException("Project not found with id: " + request.getProjectId()));

        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new NotFoundException("Vehicle not found with id: " + request.getVehicleId()));

        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new NotFoundException("Supplier not found with id: " + request.getSupplierId()));

        // Check for open Daily Log (Must exist and be OPEN? Or just not blocking?)
        // Create validation says: "Cannot create fuel entry. Please close the open
        // daily log first."
        // We should probably enforce the same rules or relax them if Refill is special.
        // Let's enforce it to be safe.
        List<DailyLog> vehicleDailyLogs = dailyLogRepository.findByVehicleId(request.getVehicleId());
        boolean hasOpenDailyLog = vehicleDailyLogs.stream()
                .anyMatch(log -> log.getStatus() == EntryStatus.OPEN);

        if (hasOpenDailyLog) {
            throw new BadRequestException("Cannot refill. Please close the open daily log first.");
        }

        // 1. Handle Existing Open Fuel Entry
        List<FuelEntry> vehicleFuelEntries = fuelEntryRepository.findByVehicleId(request.getVehicleId());
        FuelEntry openEntry = vehicleFuelEntries.stream()
                .filter(e -> e.getStatus() == EntryStatus.OPEN)
                .findFirst()
                .orElse(null);

        if (openEntry != null) {
            // Close the existing entry
            if (request.getOpeningKm() < openEntry.getOpeningKm()) {
                throw new BadRequestException("Refill KM (" + request.getOpeningKm()
                        + ") cannot be less than previous Opening KM (" + openEntry.getOpeningKm() + ")");
            }

            openEntry.setClosingKm(request.getOpeningKm());
            openEntry.setClosingKmPhoto(request.getOpeningKmPhoto()); // Use same photo for closing? Or null?
            // Usually Closing Photo of old = Opening Photo of new.
            openEntry.setDistance(request.getOpeningKm() - openEntry.getOpeningKm());
            if (openEntry.getLitres() != null && openEntry.getLitres() > 0 && openEntry.getDistance() > 0) {
                openEntry.setMileage(openEntry.getDistance() / openEntry.getLitres());
            }
            openEntry.setStatus(EntryStatus.CLOSED);
            fuelEntryRepository.save(openEntry);
        } else {
            // Validate continuity with last closed logs if no open entry
            Double lastDailyLogClosingKm = vehicleDailyLogs.stream()
                    .filter(log -> log.getStatus() == EntryStatus.CLOSED && log.getClosingKm() != null)
                    .max((a, b) -> a.getDate().compareTo(b.getDate()))
                    .map(DailyLog::getClosingKm)
                    .orElse(null);

            Double lastFuelEntryClosingKm = vehicleFuelEntries.stream()
                    .filter(entry -> entry.getStatus() == EntryStatus.CLOSED && entry.getClosingKm() != null)
                    .max((a, b) -> a.getDate().compareTo(b.getDate()))
                    .map(FuelEntry::getClosingKm)
                    .orElse(null);

            Double maxClosingKm = null;
            if (lastDailyLogClosingKm != null && lastFuelEntryClosingKm != null) {
                maxClosingKm = Math.max(lastDailyLogClosingKm, lastFuelEntryClosingKm);
            } else if (lastDailyLogClosingKm != null) {
                maxClosingKm = lastDailyLogClosingKm;
            } else if (lastFuelEntryClosingKm != null) {
                maxClosingKm = lastFuelEntryClosingKm;
            }

            if (maxClosingKm != null && request.getOpeningKm() < maxClosingKm) {
                throw new BadRequestException(
                        "Refill KM cannot be less than last recorded Closing KM (" + maxClosingKm + ")");
            }
        }

        // 2. Create New Open Entry with fuel details
        FuelEntry newEntry = new FuelEntry();
        newEntry.setDate(request.getDate());
        newEntry.setProject(project);
        newEntry.setVehicle(vehicle);
        newEntry.setFuelType(vehicle.getFuelType());
        newEntry.setSupplier(supplier);
        newEntry.setLitres(request.getLitres());
        newEntry.setPricePerLitre(request.getPricePerLitre());
        newEntry.setTotalCost(request.getLitres() * request.getPricePerLitre());
        newEntry.setOpeningKm(request.getOpeningKm());
        newEntry.setOpeningKmPhoto(request.getOpeningKmPhoto());
        newEntry.setStatus(EntryStatus.OPEN);

        return FuelEntryDto.fromEntity(fuelEntryRepository.save(newEntry));
    }
}
