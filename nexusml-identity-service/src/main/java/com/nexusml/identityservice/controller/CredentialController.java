package com.nexusml.identityservice.controller;

import com.nexusml.identityservice.dto.CreateCredentialRequest;
import com.nexusml.identityservice.dto.CredentialDTO;
import com.nexusml.identityservice.dto.DecryptedCredentialDTO;
import com.nexusml.identityservice.service.CredentialService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/credentials")
@RequiredArgsConstructor
public class CredentialController {

    private final CredentialService credentialService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DATA_SCIENTIST')")
    public ResponseEntity<List<CredentialDTO>> getAllCredentials() {
        return ResponseEntity.ok(
            credentialService.getAllCredentials());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DATA_SCIENTIST')")
    public ResponseEntity<CredentialDTO> createCredential(
            @Valid @RequestBody CreateCredentialRequest request,
            JwtAuthenticationToken authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(credentialService.createCredential(
                request, authentication.getToken().getClaimAsString("preferred_username")));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DATA_SCIENTIST')")
    public ResponseEntity<CredentialDTO> updateCredential(
            @PathVariable String id,
            @Valid @RequestBody CreateCredentialRequest request,
            JwtAuthenticationToken authentication) {
        return ResponseEntity.ok(
            credentialService.updateCredential(
                id, request, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DATA_SCIENTIST')")
    public ResponseEntity<Void> deleteCredential(
            @PathVariable String id,
            JwtAuthenticationToken authentication) {
        credentialService.deleteCredential(
            id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/decrypt")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DecryptedCredentialDTO> getDecrypted(
            @PathVariable String id,
            JwtAuthenticationToken authentication) {
        return ResponseEntity.ok(
            credentialService.getDecrypted(
                id, authentication.getName()));
    }
}
