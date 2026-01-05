package com.vebops.store.service;

import com.vebops.store.model.Contractor;
import com.vebops.store.model.Labour;
import com.vebops.store.model.LabourUtilization;
import com.vebops.store.repository.ContractorRepository;
import com.vebops.store.repository.LabourRepository;
import com.vebops.store.repository.LabourUtilizationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ContractorService {

    private final ContractorRepository contractorRepository;
    private final LabourRepository labourRepository;
    private final LabourUtilizationRepository utilizationRepository;
    private final com.vebops.store.repository.ProjectRepository projectRepository;

    public ContractorService(ContractorRepository contractorRepository,
            LabourRepository labourRepository,
            LabourUtilizationRepository utilizationRepository,
            com.vebops.store.repository.ProjectRepository projectRepository) {
        this.contractorRepository = contractorRepository;
        this.labourRepository = labourRepository;
        this.utilizationRepository = utilizationRepository;
        this.projectRepository = projectRepository;
    }

    @Transactional
    public Contractor createContractor(Contractor c, List<Long> projectIds) {
        if (projectIds != null && !projectIds.isEmpty()) {
            List<com.vebops.store.model.Project> projects = projectRepository.findAllById(projectIds);
            c.setProjects(new java.util.HashSet<>(projects));
        }

        // ensure code is non-null to satisfy existing DB constraints
        if (c.getCode() == null || c.getCode().isBlank()) {
            c.setCode("TMP-" + java.util.UUID.randomUUID().toString());
        }
        // save to obtain numeric id then set final code
        Contractor saved = contractorRepository.save(c);
        saved.setCode("CTR-" + saved.getId());
        return contractorRepository.save(saved);
    }

    public List<Contractor> listAll() {
        return contractorRepository.findAll();
    }

    public Optional<Contractor> findByCode(String code) {
        return contractorRepository.findByCode(code);
    }

    public Optional<Contractor> findByCodeOrId(String input) {
        Optional<Contractor> byCode = contractorRepository.findByCode(input);
        if (byCode.isPresent())
            return byCode;

        if (input != null && input.startsWith("CTR-")) {
            try {
                Long id = Long.parseLong(input.substring(4));
                return contractorRepository.findById(id);
            } catch (NumberFormatException e) {
                // ignore
            }
        }
        return Optional.empty();
    }

    @Transactional
    public Labour createLabour(String contractorCode, Labour labour, List<Long> projectIds) {
        Contractor contractor = findByCodeOrId(contractorCode)
                .orElseThrow(() -> new IllegalArgumentException("Contractor not found"));
        labour.setContractor(contractor);

        if (projectIds != null && !projectIds.isEmpty()) {
            List<com.vebops.store.model.Project> projects = projectRepository.findAllById(projectIds);
            labour.setProjects(new java.util.HashSet<>(projects));
        }

        if (labour.getCode() == null || labour.getCode().isBlank()) {
            labour.setCode("TMP-" + java.util.UUID.randomUUID().toString());
        }
        Labour saved = labourRepository.save(labour);
        saved.setCode("LAB-" + saved.getId());
        return labourRepository.save(saved);
    }

    public List<Contractor> listByProject(Long projectId) {
        return contractorRepository.findByProjectsId(projectId);
    }

    public List<Labour> listLaboursForContractorAndProject(Contractor contractor, Long projectId) {
        return labourRepository.findByContractorAndProjectsId(contractor, projectId);
    }

    public List<Labour> listLaboursForContractor(Contractor contractor) {
        return labourRepository.findByContractor(contractor);
    }

    public Map<String, Map<String, Double>> getUtilization(String contractorCode, LocalDate start, LocalDate end) {
        Contractor contractor = findByCodeOrId(contractorCode)
                .orElseThrow(() -> new IllegalArgumentException("Contractor not found"));
        List<Labour> labours = labourRepository.findByContractor(contractor);
        Map<String, Map<String, Double>> result = new HashMap<>();
        List<LabourUtilization> rows = utilizationRepository.findByLabourInAndDateBetween(labours, start, end);
        for (Labour l : labours) {
            result.put(l.getCode(), new HashMap<>());
        }
        for (LabourUtilization r : rows) {
            String labourCode = r.getLabour().getCode();
            result.computeIfAbsent(labourCode, k -> new HashMap<>()).put(r.getDate().toString(), r.getHours());
        }
        return result;
    }

    @Transactional
    public LabourUtilization setUtilization(String labourCode, LocalDate date, double hours) {
        Labour labour = labourRepository.findByCode(labourCode)
                .orElseThrow(() -> new IllegalArgumentException("Labour not found"));
        // find existing
        List<LabourUtilization> existing = utilizationRepository.findByLabourInAndDateBetween(List.of(labour), date,
                date);
        LabourUtilization u;
        if (!existing.isEmpty()) {
            u = existing.get(0);
            u.setHours(hours);
        } else {
            u = new LabourUtilization();
            u.setLabour(labour);
            u.setDate(date);
            u.setHours(hours);
        }
        return utilizationRepository.save(u);
    }

    @Transactional
    public void updateProjectLabours(String contractorCode, Long projectId, List<String> labourCodes) {
        Contractor contractor = findByCodeOrId(contractorCode)
                .orElseThrow(() -> new IllegalArgumentException("Contractor not found"));

        com.vebops.store.model.Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        List<Labour> allLabours = labourRepository.findByContractor(contractor);

        for (Labour labour : allLabours) {
            boolean shouldBeLinked = labourCodes.contains(labour.getCode())
                    || labourCodes.contains(String.valueOf(labour.getId()));
            if (shouldBeLinked) {
                labour.getProjects().add(project);
            } else {
                labour.getProjects().remove(project);
            }
            labourRepository.save(labour);
        }
    }

    @Transactional
    public void bulkAssignContractors(List<Long> contractorIds, List<Long> projectIds) {
        if (projectIds == null || projectIds.isEmpty())
            return;
        List<com.vebops.store.model.Project> projects = projectRepository.findAllById(projectIds);
        if (projects.isEmpty())
            return;

        List<Contractor> contractors = contractorRepository.findAllById(contractorIds);
        for (Contractor c : contractors) {
            c.getProjects().addAll(projects);
            contractorRepository.save(c);
        }
    }
}
