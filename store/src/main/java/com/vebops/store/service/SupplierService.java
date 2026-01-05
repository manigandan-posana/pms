package com.vebops.store.service;

import com.vebops.store.dto.CreateSupplierRequest;
import com.vebops.store.dto.SupplierDto;
import com.vebops.store.dto.UpdateSupplierRequest;
import com.vebops.store.exception.NotFoundException;
import com.vebops.store.model.Project;
import com.vebops.store.model.Supplier;
import com.vebops.store.model.SupplierType;
import com.vebops.store.repository.ProjectRepository;
import com.vebops.store.repository.SupplierRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final ProjectRepository projectRepository;

    public SupplierService(SupplierRepository supplierRepository, ProjectRepository projectRepository) {
        this.supplierRepository = supplierRepository;
        this.projectRepository = projectRepository;
    }

    public List<SupplierDto> getAllSuppliers() {
        return supplierRepository.findAll().stream()
                .map(SupplierDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<SupplierDto> getSuppliersByProject(Long projectId) {
        return supplierRepository.findByProjectsId(projectId).stream()
                .map(SupplierDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<SupplierDto> getSuppliersByProjectAndType(Long projectId, SupplierType type) {
        return supplierRepository.findByProjectsIdAndSupplierType(projectId, type).stream()
                .map(SupplierDto::fromEntity)
                .collect(Collectors.toList());
    }

    public SupplierDto getSupplierById(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Supplier not found with id: " + id));
        return SupplierDto.fromEntity(supplier);
    }

    @Transactional
    public SupplierDto createSupplier(CreateSupplierRequest request) {
        // Get projects
        java.util.List<Project> projects = new java.util.ArrayList<>();
        if (request.getProjectIds() != null && !request.getProjectIds().isEmpty()) {
            projects = projectRepository.findAllById(request.getProjectIds());
        }
        // PROJECTS CAN BE EMPTY

        // Generate unique supplier code
        String code = generateSupplierCode();

        // Create supplier
        Supplier supplier = new Supplier();
        supplier.setProjects(new java.util.HashSet<>(projects));
        supplier.setCode(code);
        supplier.setSupplierName(request.getSupplierName());
        supplier.setSupplierType(request.getSupplierType());
        supplier.setContactPerson(request.getContactPerson());
        supplier.setEmail(request.getEmail());
        supplier.setPhoneNumber(request.getPhoneNumber());
        supplier.setAddress(request.getAddress());
        supplier.setGstNo(request.getGstNo());
        supplier.setPanNo(request.getPanNo());
        supplier.setBankHolderName(request.getBankHolderName());
        supplier.setBankName(request.getBankName());
        supplier.setAccountNo(request.getAccountNo());
        supplier.setIfscCode(request.getIfscCode());
        supplier.setBranch(request.getBranch());
        supplier.setBusinessType(request.getBusinessType());

        Supplier saved = supplierRepository.save(supplier);
        return SupplierDto.fromEntity(saved);
    }

    @Transactional
    public SupplierDto updateSupplier(Long id, UpdateSupplierRequest request) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Supplier not found with id: " + id));

        supplier.setSupplierName(request.getSupplierName());
        supplier.setSupplierType(request.getSupplierType());
        supplier.setContactPerson(request.getContactPerson());
        supplier.setEmail(request.getEmail());
        supplier.setPhoneNumber(request.getPhoneNumber());
        supplier.setAddress(request.getAddress());
        supplier.setGstNo(request.getGstNo());
        supplier.setPanNo(request.getPanNo());
        supplier.setBankHolderName(request.getBankHolderName());
        supplier.setBankName(request.getBankName());
        supplier.setAccountNo(request.getAccountNo());
        supplier.setIfscCode(request.getIfscCode());
        supplier.setBranch(request.getBranch());
        if (request.getProjectIds() != null && !request.getProjectIds().isEmpty()) {
            List<Project> projects = projectRepository.findAllById(request.getProjectIds());
            supplier.setProjects(new java.util.HashSet<>(projects));
        }

        supplier.setBusinessType(request.getBusinessType());

        Supplier updated = supplierRepository.save(supplier);
        return SupplierDto.fromEntity(updated);
    }

    @Transactional
    public void deleteSupplier(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Supplier not found with id: " + id));
        supplierRepository.delete(supplier);
    }

    @Transactional
    public void bulkAssignSuppliers(List<Long> supplierIds, List<Long> projectIds) {
        if (projectIds == null || projectIds.isEmpty())
            return;
        List<Project> projects = projectRepository.findAllById(projectIds);
        if (projects.isEmpty())
            return;

        List<Supplier> suppliers = supplierRepository.findAllById(supplierIds);
        for (Supplier s : suppliers) {
            s.getProjects().addAll(projects);
            supplierRepository.save(s);
        }
    }

    /**
     * Generate a unique supplier code in the format: SUP-YYYYMMDD-XXXX
     * where XXXX is a sequential number for the day
     */
    private String generateSupplierCode() {
        String dateStr = LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
        String prefix = "SUP-" + dateStr + "-";

        // Find the highest sequence number for today
        List<Supplier> todaysSuppliers = supplierRepository.findAll().stream()
                .filter(s -> s.getCode() != null && s.getCode().startsWith(prefix))
                .collect(Collectors.toList());

        int maxSeq = 0;
        for (Supplier s : todaysSuppliers) {
            try {
                String seqStr = s.getCode().substring(prefix.length());
                int seq = Integer.parseInt(seqStr);
                if (seq > maxSeq) {
                    maxSeq = seq;
                }
            } catch (Exception e) {
                // Ignore invalid codes
            }
        }

        int nextSeq = maxSeq + 1;
        return prefix + String.format("%04d", nextSeq);
    }
}
