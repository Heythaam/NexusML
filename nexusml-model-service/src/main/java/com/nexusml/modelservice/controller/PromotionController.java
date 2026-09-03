package com.nexusml.modelservice.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.nexusml.modelservice.dto.CreatePromotionRequest;
import com.nexusml.modelservice.dto.PromotionRequestDTO;
import com.nexusml.modelservice.service.PromotionService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class PromotionController {

    private final PromotionService promotionService;

    @GetMapping("/promotions")
    @PreAuthorize("hasAnyRole('ADMIN','DATA_SCIENTIST')")
    public ResponseEntity<List<PromotionRequestDTO>> getAllRequests() {
        return ResponseEntity.ok(promotionService.getAllRequests());
    }

    @GetMapping("/promotions/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'DATA_SCIENTIST')")
    public ResponseEntity<List<PromotionRequestDTO>> getPendingRequests() {
        return ResponseEntity.ok(promotionService.getPendingRequests());
    }

    @PostMapping("/promotions")
    @PreAuthorize("hasAnyRole('ADMIN','DATA_SCIENTIST')")
    public ResponseEntity<PromotionRequestDTO> createRequest(
            @Valid @RequestBody CreatePromotionRequest request,
            JwtAuthenticationToken authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(promotionService.createRequest(
                request,
                authentication.getToken().getClaimAsString("preferred_username")));
    }

    @PostMapping("/promotions/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PromotionRequestDTO> approve(
            @PathVariable String id,
            JwtAuthenticationToken authentication) {
        return ResponseEntity.ok(
            promotionService.approveRequest(id,
                authentication.getToken().getClaimAsString("preferred_username")));
    }

    @PostMapping("/promotions/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PromotionRequestDTO> reject(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            JwtAuthenticationToken authentication) {
        return ResponseEntity.ok(
            promotionService.rejectRequest(id,
                authentication.getToken().getClaimAsString("preferred_username"),
                body.getOrDefault("reason", "")));
    }
}
