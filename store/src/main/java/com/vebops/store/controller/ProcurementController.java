package com.vebops.store.controller;

import com.vebops.store.dto.CreateProcurementRequest;
import com.vebops.store.dto.ProcurementRequestDto;
import com.vebops.store.dto.PaginatedResponse;
import com.vebops.store.dto.ResolveProcurementRequest;
import com.vebops.store.model.UserAccount;
import com.vebops.store.service.AuthService;
import com.vebops.store.service.ProcurementService;
import com.vebops.store.util.AuthUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/procurement")
public class ProcurementController {

    private final AuthService authService;
    private final ProcurementService procurementService;

    public ProcurementController(AuthService authService, ProcurementService procurementService) {
        this.authService = authService;
        this.procurementService = procurementService;
    }

    @GetMapping("/requests")
    public PaginatedResponse<ProcurementRequestDto> list(
        @org.springframework.web.bind.annotation.RequestParam(name = "page", defaultValue = "1") int page,
        @org.springframework.web.bind.annotation.RequestParam(name = "size", defaultValue = "10") int size
    ) {
        Long userId = AuthUtils.requireUserId();
        UserAccount user = authService.getUserById(userId);
        return procurementService.listRequests(user, page, size);
    }

    @PostMapping("/requests")
    public ProcurementRequestDto create(
        @RequestBody CreateProcurementRequest request
    ) {
        Long userId = AuthUtils.requireUserId();
        UserAccount user = authService.getUserById(userId);
        return procurementService.createRequest(user, request);
    }

    @PostMapping("/requests/{id}/decision")
    public ProcurementRequestDto decide(
        @PathVariable Long id,
        @RequestBody ResolveProcurementRequest request
    ) {
        Long userId = AuthUtils.requireUserId();
        UserAccount user = authService.getUserById(userId);
        return procurementService.resolveRequest(user, id, request);
    }
}
