package com.vebops.store.controller;

import com.vebops.store.dto.CreateContractorRequest;
import com.vebops.store.dto.CreateLabourRequest;
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

@RestController
@RequestMapping("/api/contractors")
public class ContractorController {

    private final ContractorService contractorService;

    public ContractorController(ContractorService contractorService) {
        this.contractorService = contractorService;
    }

    @GetMapping
    public List<Contractor> list() {
        return contractorService.listAll();
    }

    @PostMapping
    public ResponseEntity<Contractor> create(@RequestBody CreateContractorRequest req) {
        Contractor c = new Contractor();
        c.setName(req.name);
        c.setMobile(req.mobile);
        c.setEmail(req.email);
        c.setAddress(req.address);
        c.setPanCard(req.panCard);
        c.setContactPerson(req.contactPerson);
        c.setGstNumber(req.gstNumber);
        c.setBankAccountHolderName(req.bankAccountHolderName);
        c.setBankName(req.bankName);
        c.setBankAccountNumber(req.bankAccountNumber);
        c.setIfscCode(req.ifscCode);
        c.setBankBranch(req.bankBranch);
        c.setType(req.type == null ? "Work" : req.type);
        Contractor created = contractorService.createContractor(c);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{code}")
    public ResponseEntity<Contractor> get(@PathVariable String code) {
        return contractorService.findByCodeOrId(code)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{code}/labours")
    public ResponseEntity<List<Labour>> listLabours(@PathVariable String code) {
        var opt = contractorService.findByCodeOrId(code);
        if (opt.isEmpty())
            return ResponseEntity.notFound().build();
        List<Labour> labours = contractorService.listLaboursForContractor(opt.get());
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
            Labour created = contractorService.createLabour(code, lab);
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
}
