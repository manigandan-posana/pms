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
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final ProjectRepository projectRepository;
    private final VehicleStatusHistoryRepository statusHistoryRepository;

    public VehicleService(
            VehicleRepository vehicleRepository,
            ProjectRepository projectRepository,
            VehicleStatusHistoryRepository statusHistoryRepository) {
        this.vehicleRepository = vehicleRepository;
        this.projectRepository = projectRepository;
        this.statusHistoryRepository = statusHistoryRepository;
    }

    public List<VehicleDto> getAllVehicles() {
        return vehicleRepository.findAll().stream()
                .map(VehicleDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<VehicleDto> getVehiclesByProject(Long projectId) {
        return vehicleRepository.findByProjectId(projectId).stream()
                .map(VehicleDto::fromEntity)
                .collect(Collectors.toList());
    }

    public VehicleDto getVehicleById(Long id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Vehicle not found with id: " + id));
        
        VehicleDto dto = VehicleDto.fromEntity(vehicle);
        
        // Load status history
        List<VehicleDto.StatusHistoryDto> history = statusHistoryRepository
                .findByVehicleIdOrderByStartDateDesc(id).stream()
                .map(h -> {
                    VehicleDto.StatusHistoryDto historyDto = new VehicleDto.StatusHistoryDto();
                    historyDto.setId(h.getId());
                    historyDto.setStatus(h.getStatus().name());
                    historyDto.setStartDate(h.getStartDate());
                    historyDto.setEndDate(h.getEndDate());
                    historyDto.setReason(h.getReason());
                    return historyDto;
                })
                .collect(Collectors.toList());
        
        dto.setStatusHistory(history);
        return dto;
    }

    @Transactional
    public VehicleDto createVehicle(CreateVehicleRequest request) {
        // Check if vehicle number already exists
        if (vehicleRepository.existsByVehicleNumber(request.getVehicleNumber())) {
            throw new BadRequestException("Vehicle with number " + request.getVehicleNumber() + " already exists");
        }

        // Get project
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new NotFoundException("Project not found with id: " + request.getProjectId()));

        // Create vehicle
        Vehicle vehicle = new Vehicle();
        vehicle.setProject(project);
        vehicle.setVehicleName(request.getVehicleName());
        vehicle.setVehicleNumber(request.getVehicleNumber());
        vehicle.setVehicleType(VehicleType.valueOf(request.getVehicleType()));
        vehicle.setFuelType(FuelType.valueOf(request.getFuelType()));
        vehicle.setStatus(VehicleStatus.valueOf(request.getStatus()));
        vehicle.setStartDate(request.getStartDate());
        vehicle.setEndDate(request.getEndDate());
        vehicle.setRentPrice(request.getRentPrice());
        
        if (request.getRentPeriod() != null) {
            vehicle.setRentPeriod(RentPeriod.valueOf(request.getRentPeriod()));
        }

        Vehicle saved = vehicleRepository.save(vehicle);

        // Create initial status history
        VehicleStatusHistory history = new VehicleStatusHistory();
        history.setVehicle(saved);
        history.setStatus(saved.getStatus());
        history.setStartDate(saved.getStartDate() != null ? saved.getStartDate() : LocalDate.now());
        history.setReason("Initial status");
        statusHistoryRepository.save(history);

        return getVehicleById(saved.getId());
    }

    @Transactional
    public VehicleDto updateVehicle(Long id, CreateVehicleRequest request) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Vehicle not found with id: " + id));

        // Check if vehicle number is being changed and if it already exists
        if (!vehicle.getVehicleNumber().equals(request.getVehicleNumber()) &&
                vehicleRepository.existsByVehicleNumber(request.getVehicleNumber())) {
            throw new BadRequestException("Vehicle with number " + request.getVehicleNumber() + " already exists");
        }

        // Get project
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new NotFoundException("Project not found with id: " + request.getProjectId()));

        vehicle.setProject(project);
        vehicle.setVehicleName(request.getVehicleName());
        vehicle.setVehicleNumber(request.getVehicleNumber());
        vehicle.setVehicleType(VehicleType.valueOf(request.getVehicleType()));
        vehicle.setFuelType(FuelType.valueOf(request.getFuelType()));
        vehicle.setStartDate(request.getStartDate());
        vehicle.setEndDate(request.getEndDate());
        vehicle.setRentPrice(request.getRentPrice());
        
        if (request.getRentPeriod() != null) {
            vehicle.setRentPeriod(RentPeriod.valueOf(request.getRentPeriod()));
        }

        vehicleRepository.save(vehicle);
        return getVehicleById(id);
    }

    @Transactional
    public VehicleDto updateVehicleStatus(Long id, UpdateVehicleStatusRequest request) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Vehicle not found with id: " + id));

        VehicleStatus newStatus = VehicleStatus.valueOf(request.getStatus());
        
        // Only create history if status actually changed
        if (vehicle.getStatus() != newStatus) {
            // Close current status history
            List<VehicleStatusHistory> currentHistory = statusHistoryRepository
                    .findByVehicleIdOrderByStartDateDesc(id);
            
            if (!currentHistory.isEmpty() && currentHistory.get(0).getEndDate() == null) {
                VehicleStatusHistory latest = currentHistory.get(0);
                latest.setEndDate(request.getStatusChangeDate());
                statusHistoryRepository.save(latest);
            }

            // Create new status history
            VehicleStatusHistory newHistory = new VehicleStatusHistory();
            newHistory.setVehicle(vehicle);
            newHistory.setStatus(newStatus);
            newHistory.setStartDate(request.getStatusChangeDate());
            newHistory.setReason(request.getReason());
            statusHistoryRepository.save(newHistory);

            // Update vehicle status
            vehicle.setStatus(newStatus);
            vehicleRepository.save(vehicle);
        }

        return getVehicleById(id);
    }

    @Transactional
    public void deleteVehicle(Long id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Vehicle not found with id: " + id));
        vehicleRepository.delete(vehicle);
    }
}
