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
                request.getVehicleId(), request.getDate(), EntryStatus.OPEN
        ).ifPresent(log -> {
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
}
