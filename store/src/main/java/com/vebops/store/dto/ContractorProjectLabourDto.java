package com.vebops.store.dto;

import java.util.List;

/**
 * DTO for managing project-specific labour assignments for contractors
 */
public class ContractorProjectLabourDto {
    private Long contractorId;
    private Long projectId;
    private List<Long> labourIds;

    public Long getContractorId() {
        return contractorId;
    }

    public void setContractorId(Long contractorId) {
        this.contractorId = contractorId;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public List<Long> getLabourIds() {
        return labourIds;
    }

    public void setLabourIds(List<Long> labourIds) {
        this.labourIds = labourIds;
    }
}
