package com.vebops.store.controller;

import com.vebops.store.dto.InventoryCodesResponse;
import com.vebops.store.dto.InwardRequest;
import com.vebops.store.dto.OutwardRequest;
import com.vebops.store.dto.TransferRequest;
import com.vebops.store.service.AuthService;
import com.vebops.store.service.InventoryService;
import com.vebops.store.util.AuthUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class InventoryController {

    private static final Logger log = LoggerFactory.getLogger(InventoryController.class);

    private final InventoryService inventoryService;
    private final AuthService authService;

    public InventoryController(InventoryService inventoryService, AuthService authService) {
        this.inventoryService = inventoryService;
        this.authService = authService;
    }

    @GetMapping("/inventory/codes")
    public InventoryCodesResponse nextCodes() {
        AuthUtils.requireUserId();
        return inventoryService.generateCodes();
    }

    @PostMapping("/inwards")
    public ResponseEntity<Void> createInward(
        @RequestBody InwardRequest request
    ) {
        log.info("createInward: Received inward request with projectId={}", request.projectId());
        AuthUtils.requireUserId();
        inventoryService.registerInward(request);
        log.info("createInward: Successfully created inward record");
        return ResponseEntity.ok().build();
    }

    @PostMapping("/outwards")
    public ResponseEntity<Void> createOutward(
        @RequestBody OutwardRequest request
    ) {
        log.info("createOutward: Received outward request with projectId={}, issueTo={}, status={}, lines={}",
                request.projectId(), request.issueTo(), request.status(), request.lines() != null ? request.lines().size() : 0);
        AuthUtils.requireUserId();
        inventoryService.registerOutward(request);
        log.info("createOutward: Successfully created outward record");
        return ResponseEntity.ok().build();
    }

    @PostMapping("/transfers")
    public ResponseEntity<Void> createTransfer(
        @RequestBody TransferRequest request
    ) {
        AuthUtils.requireUserId();
        inventoryService.registerTransfer(request);
        return ResponseEntity.ok().build();
    }
}
