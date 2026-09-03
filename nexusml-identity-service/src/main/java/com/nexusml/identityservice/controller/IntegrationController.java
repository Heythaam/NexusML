package com.nexusml.identityservice.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nexusml.identityservice.dto.UpdateIntegrationRequest;
import com.nexusml.identityservice.model.IntegrationConfig;
import com.nexusml.identityservice.service.IntegrationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/integrations")
@RequiredArgsConstructor
public class IntegrationController {

    private final IntegrationService integrationService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','DATA_SCIENTIST','VIEWER')")
    public ResponseEntity<List<IntegrationConfig>> getAllIntegrations() {
        return ResponseEntity.ok(integrationService.getAllIntegrations());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DATA_SCIENTIST')")
    public ResponseEntity<IntegrationConfig> getIntegration(@PathVariable String id) {
        return ResponseEntity.ok(integrationService.getIntegration(id));
    }

    @GetMapping("/{id}/url")
    @PreAuthorize("hasAnyRole('ADMIN','DATA_SCIENTIST','VIEWER')")
    public ResponseEntity<Map<String, String>> getUrl(@PathVariable String id) {
        String url = integrationService.getIntegrationUrl(id);
        return url != null
            ? ResponseEntity.ok(Map.of("url", url))
            : ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DATA_SCIENTIST')")
    public ResponseEntity<IntegrationConfig> updateIntegration(
            @PathVariable String id,
            @Valid @RequestBody UpdateIntegrationRequest request,
            JwtAuthenticationToken authentication) {
        return ResponseEntity.ok(
            integrationService.updateIntegration(
                id, request,
                authentication.getToken().getClaimAsString("preferred_username")));
    }

    @PostMapping("/{id}/test")
    @PreAuthorize("hasAnyRole('ADMIN', 'DATA_SCIENTIST')")
    public ResponseEntity<IntegrationConfig> testConnection(@PathVariable String id) {
        // For now just mark as connected — real test happens via pipeline/model service
        IntegrationConfig config = integrationService.updateStatus(id, "connected");
        return ResponseEntity.ok(config);
    }
}
