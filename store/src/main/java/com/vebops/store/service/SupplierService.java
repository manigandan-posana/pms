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
        return supplierRepository.findByProjectId(projectId).stream()
                .map(SupplierDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<SupplierDto> getSuppliersByProjectAndType(Long projectId, SupplierType type) {
        return supplierRepository.findByProjectIdAndSupplierType(projectId, type).stream()
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
        // Get project
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new NotFoundException("Project not found with id: " + request.getProjectId()));

        // Generate unique supplier code
        String code = generateSupplierCode(project);

        // Create supplier
        Supplier supplier = new Supplier();
        supplier.setProject(project);
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

    /**
     * Generate a unique supplier code in the format: SUP-YYYYMMDD-XXXX
     * where XXXX is a sequential number for the day
     */
    private String generateSupplierCode(Project project) {
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
