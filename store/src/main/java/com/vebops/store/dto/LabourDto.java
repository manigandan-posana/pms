package com.vebops.store.dto;

import com.vebops.store.model.Labour;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * DTO for Labour with project information
 */
public class LabourDto {
    private Long id;
    private String code;
    private String name;
    private LocalDate dob;
    private boolean active;
    private String aadharNumber;
    private String bloodGroup;
    private String contactNumber;
    private String emergencyContactNumber;
    private String contactAddress;
    private String esiNumber;
    private String uanNumber;
    private LocalDateTime createdAt;
    private Long contractorId;
    private String contractorCode;
    private String contractorName;
    private List<ProjectInfo> projects;

    public static LabourDto fromEntity(Labour labour) {
        LabourDto dto = new LabourDto();
        dto.setId(labour.getId());
        dto.setCode(labour.getCode());
        dto.setName(labour.getName());
        dto.setDob(labour.getDob());
        dto.setActive(labour.isActive());
        dto.setAadharNumber(labour.getAadharNumber());
        dto.setBloodGroup(labour.getBloodGroup());
        dto.setContactNumber(labour.getContactNumber());
        dto.setEmergencyContactNumber(labour.getEmergencyContactNumber());
        dto.setContactAddress(labour.getContactAddress());
        dto.setEsiNumber(labour.getEsiNumber());
        dto.setUanNumber(labour.getUanNumber());
        dto.setCreatedAt(labour.getCreatedAt());
        if (labour.getContractor() != null) {
            dto.setContractorId(labour.getContractor().getId());
            dto.setContractorCode(labour.getContractor().getCode());
            dto.setContractorName(labour.getContractor().getName());
        }
        if (labour.getProjects() != null) {
            dto.setProjects(labour.getProjects().stream()
                .map(p -> new ProjectInfo(p.getId(), p.getCode(), p.getName()))
                .collect(Collectors.toList()));
        }
        return dto;
    }

    public static class ProjectInfo {
        private Long id;
        private String code;
        private String name;

        public ProjectInfo(Long id, String code, String name) {
            this.id = id;
            this.code = code;
            this.name = name;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LocalDate getDob() {
        return dob;
    }

    public void setDob(LocalDate dob) {
        this.dob = dob;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getAadharNumber() {
        return aadharNumber;
    }

    public void setAadharNumber(String aadharNumber) {
        this.aadharNumber = aadharNumber;
    }

    public String getBloodGroup() {
        return bloodGroup;
    }

    public void setBloodGroup(String bloodGroup) {
        this.bloodGroup = bloodGroup;
    }

    public String getContactNumber() {
        return contactNumber;
    }

    public void setContactNumber(String contactNumber) {
        this.contactNumber = contactNumber;
    }

    public String getEmergencyContactNumber() {
        return emergencyContactNumber;
    }

    public void setEmergencyContactNumber(String emergencyContactNumber) {
        this.emergencyContactNumber = emergencyContactNumber;
    }

    public String getContactAddress() {
        return contactAddress;
    }

    public void setContactAddress(String contactAddress) {
        this.contactAddress = contactAddress;
    }

    public String getEsiNumber() {
        return esiNumber;
    }

    public void setEsiNumber(String esiNumber) {
        this.esiNumber = esiNumber;
    }

    public String getUanNumber() {
        return uanNumber;
    }

    public void setUanNumber(String uanNumber) {
        this.uanNumber = uanNumber;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Long getContractorId() {
        return contractorId;
    }

    public void setContractorId(Long contractorId) {
        this.contractorId = contractorId;
    }

    public String getContractorCode() {
        return contractorCode;
    }

    public void setContractorCode(String contractorCode) {
        this.contractorCode = contractorCode;
    }

    public String getContractorName() {
        return contractorName;
    }

    public void setContractorName(String contractorName) {
        this.contractorName = contractorName;
    }

    public List<ProjectInfo> getProjects() {
        return projects;
    }

    public void setProjects(List<ProjectInfo> projects) {
        this.projects = projects;
    }
}
