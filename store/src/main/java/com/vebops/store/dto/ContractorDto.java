package com.vebops.store.dto;

import com.vebops.store.model.Contractor;
import com.vebops.store.model.Project;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * DTO for Contractor with project information
 */
public class ContractorDto {
    private Long id;
    private String code;
    private String name;
    private String mobile;
    private String email;
    private String address;
    private String panCard;
    private String type;
    private String contactPerson;
    private String gstNumber;
    private String bankAccountHolderName;
    private String bankName;
    private String bankAccountNumber;
    private String ifscCode;
    private String bankBranch;
    private LocalDateTime createdAt;
    private List<ProjectInfo> projects;

    public static ContractorDto fromEntity(Contractor contractor) {
        ContractorDto dto = new ContractorDto();
        dto.setId(contractor.getId());
        dto.setCode(contractor.getCode());
        dto.setName(contractor.getName());
        dto.setMobile(contractor.getMobile());
        dto.setEmail(contractor.getEmail());
        dto.setAddress(contractor.getAddress());
        dto.setPanCard(contractor.getPanCard());
        dto.setType(contractor.getType());
        dto.setContactPerson(contractor.getContactPerson());
        dto.setGstNumber(contractor.getGstNumber());
        dto.setBankAccountHolderName(contractor.getBankAccountHolderName());
        dto.setBankName(contractor.getBankName());
        dto.setBankAccountNumber(contractor.getBankAccountNumber());
        dto.setIfscCode(contractor.getIfscCode());
        dto.setBankBranch(contractor.getBankBranch());
        dto.setCreatedAt(contractor.getCreatedAt());
        if (contractor.getProjects() != null) {
            dto.setProjects(contractor.getProjects().stream()
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

    public String getMobile() {
        return mobile;
    }

    public void setMobile(String mobile) {
        this.mobile = mobile;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getPanCard() {
        return panCard;
    }

    public void setPanCard(String panCard) {
        this.panCard = panCard;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getContactPerson() {
        return contactPerson;
    }

    public void setContactPerson(String contactPerson) {
        this.contactPerson = contactPerson;
    }

    public String getGstNumber() {
        return gstNumber;
    }

    public void setGstNumber(String gstNumber) {
        this.gstNumber = gstNumber;
    }

    public String getBankAccountHolderName() {
        return bankAccountHolderName;
    }

    public void setBankAccountHolderName(String bankAccountHolderName) {
        this.bankAccountHolderName = bankAccountHolderName;
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }

    public String getBankAccountNumber() {
        return bankAccountNumber;
    }

    public void setBankAccountNumber(String bankAccountNumber) {
        this.bankAccountNumber = bankAccountNumber;
    }

    public String getIfscCode() {
        return ifscCode;
    }

    public void setIfscCode(String ifscCode) {
        this.ifscCode = ifscCode;
    }

    public String getBankBranch() {
        return bankBranch;
    }

    public void setBankBranch(String bankBranch) {
        this.bankBranch = bankBranch;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<ProjectInfo> getProjects() {
        return projects;
    }

    public void setProjects(List<ProjectInfo> projects) {
        this.projects = projects;
    }
}
