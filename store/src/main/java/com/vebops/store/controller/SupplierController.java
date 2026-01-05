package com.vebops.store.controller;

import com.vebops.store.dto.CreateSupplierRequest;
import com.vebops.store.dto.SupplierDto;
import com.vebops.store.dto.UpdateSupplierRequest;
import com.vebops.store.model.SupplierType;
import com.vebops.store.service.SupplierService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
public class SupplierController {

    private final SupplierService supplierService;

    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    @GetMapping
    public ResponseEntity<List<SupplierDto>> getAllSuppliers() {
        return ResponseEntity.ok(supplierService.getAllSuppliers());
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<SupplierDto>> getSuppliersByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(supplierService.getSuppliersByProject(projectId));
    }

    @GetMapping("/project/{projectId}/type/{type}")
    public ResponseEntity<List<SupplierDto>> getSuppliersByProjectAndType(
            @PathVariable Long projectId,
            @PathVariable SupplierType type) {
        return ResponseEntity.ok(supplierService.getSuppliersByProjectAndType(projectId, type));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SupplierDto> getSupplierById(@PathVariable Long id) {
        return ResponseEntity.ok(supplierService.getSupplierById(id));
    }

    @PostMapping
    public ResponseEntity<SupplierDto> createSupplier(@Valid @RequestBody CreateSupplierRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(supplierService.createSupplier(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SupplierDto> updateSupplier(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSupplierRequest request) {
        return ResponseEntity.ok(supplierService.updateSupplier(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSupplier(@PathVariable Long id) {
        supplierService.deleteSupplier(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/bulk-assign")
    public ResponseEntity<Void> bulkAssign(@RequestBody BulkAssignRequest req) {
        supplierService.bulkAssignSuppliers(req.ids, req.projectIds);
        return ResponseEntity.ok().build();
    }

    public static class BulkAssignRequest {
        public List<Long> ids;
        public List<Long> projectIds;
    }
}
