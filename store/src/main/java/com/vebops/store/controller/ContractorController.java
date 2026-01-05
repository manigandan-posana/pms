package com.vebops.store.controller;

import com.vebops.store.dto.ContractorDto;
import com.vebops.store.dto.CreateContractorRequest;
import com.vebops.store.dto.CreateLabourRequest;
import com.vebops.store.dto.LabourDto;
import com.vebops.store.dto.UtilizationDto;
import com.vebops.store.model.Contractor;
import com.vebops.store.model.Labour;
import com.vebops.store.model.LabourUtilization;
import com.vebops.store.service.ContractorService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.Period;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/contractors")
public class ContractorController {

    private final ContractorService contractorService;

    public ContractorController(ContractorService contractorService) {
        this.contractorService = contractorService;
    }

    @GetMapping
    public ResponseEntity<?> list(@RequestParam(required = false) Long projectId, 
                                    @RequestParam(required = false, defaultValue = "false") boolean includeProjects) {
        if (projectId != null) {
            // Return contractors linked to specific project
            List<Contractor> contractors = contractorService.listByProject(projectId);
            if (includeProjects) {
                return ResponseEntity.ok(contractors.stream()
                    .map(ContractorDto::fromEntity)
                    .collect(Collectors.toList()));
            }
            return ResponseEntity.ok(contractors);
        }
        // Return all contractors
        if (includeProjects) {
            return ResponseEntity.ok(contractorService.listAllWithProjects());
        }
        return ResponseEntity.ok(contractorService.listAll());
    }

    @PostMapping
    public ResponseEntity<Contractor> create(@RequestBody CreateContractorRequest req) {
        Contractor c = new Contractor();
        c.setName(req.name);
        c.setMobile(req.mobile);
        c.setEmail(req.email);
        c.setAddress(req.address);
        c.setPanCard(req.panCard);
        c.setType(req.type);
        c.setContactPerson(req.contactPerson);
        c.setGstNumber(req.gstNumber);
        c.setBankAccountHolderName(req.bankAccountHolderName);
        c.setBankName(req.bankName);
        c.setBankAccountNumber(req.bankAccountNumber);
        c.setIfscCode(req.ifscCode);
        c.setBankBranch(req.bankBranch);

        Contractor created = contractorService.createContractor(c, req.projectIds);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{code}")
    public ResponseEntity<Contractor> get(@PathVariable String code) {
        var opt = contractorService.findByCodeOrId(code);
        return opt.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{code}/labours")
    public ResponseEntity<?> listLabours(@PathVariable String code,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false, defaultValue = "false") boolean includeProjects) {
        var opt = contractorService.findByCodeOrId(code);
        if (opt.isEmpty())
            return ResponseEntity.notFound().build();

        List<Labour> labours;
        if (projectId != null) {
            labours = contractorService.listLaboursForContractorAndProject(opt.get(), projectId);
        } else {
            labours = contractorService.listLaboursForContractor(opt.get());
        }
        
        if (includeProjects) {
            return ResponseEntity.ok(labours.stream()
                .map(LabourDto::fromEntity)
                .collect(Collectors.toList()));
        }
        return ResponseEntity.ok(labours);
    }

    @PostMapping("/{code}/labours")
    public ResponseEntity<?> createLabour(@PathVariable String code, @RequestBody CreateLabourRequest req) {
        var opt = contractorService.findByCodeOrId(code);
        if (opt.isEmpty())
            return ResponseEntity.notFound().build();
        try {
            LocalDate dob = LocalDate.parse(req.dob);
            int age = Period.between(dob, LocalDate.now()).getYears();
            if (age >= 60) {
                Map<String, String> m = new HashMap<>();
                m.put("error", "Labour creation not allowed when age is 60 or above.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(m);
            }

            Labour lab = new Labour();
            lab.setName(req.name);
            lab.setDob(dob);
            lab.setActive(req.active == null ? true : req.active);
            lab.setAadharNumber(req.aadharNumber);
            lab.setBloodGroup(req.bloodGroup);
            lab.setContactNumber(req.contactNumber);
            lab.setEmergencyContactNumber(req.emergencyContactNumber);
            lab.setContactAddress(req.contactAddress);
            lab.setEsiNumber(req.esiNumber);
            lab.setUanNumber(req.uanNumber);
            Labour created = contractorService.createLabour(code, lab, req.projectIds);
            Map<String, Object> resp = new HashMap<>();
            resp.put("labour", created);
            if (age > 55)
                resp.put("warning", "Labour age is above 55.");
            return ResponseEntity.status(HttpStatus.CREATED).body(resp);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid date format for DOB."));
        }
    }

    @GetMapping("/{code}/utilization")
    public ResponseEntity<UtilizationDto> getUtilization(
            @PathVariable String code,
            @RequestParam("start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam("end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        Map<String, Map<String, Double>> data = contractorService.getUtilization(code, start, end);
        UtilizationDto dto = new UtilizationDto();
        dto.contractorCode = code;
        dto.data = data;
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/labours/{labourCode}/utilization")
    public ResponseEntity<?> setHours(@PathVariable String labourCode,
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam("hours") double hours) {
        LabourUtilization saved = contractorService.setUtilization(labourCode, date, hours);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{code}/projects/{projectId}/labours")
    public ResponseEntity<?> updateProjectLabours(
            @PathVariable String code,
            @PathVariable Long projectId,
            @RequestBody List<String> labourCodes) {
        contractorService.updateProjectLabours(code, projectId, labourCodes);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/bulk-assign")
    public ResponseEntity<Void> bulkAssign(@RequestBody BulkAssignRequest req) {
        contractorService.bulkAssignContractors(req.ids, req.projectIds);
        return ResponseEntity.ok().build();
    }

    public static class BulkAssignRequest {
        public List<Long> ids;
        public List<Long> projectIds;
    }
}
