package com.nexusml.identityservice.controller;

import com.nexusml.identityservice.dto.UserSyncRequest;
import com.nexusml.identityservice.model.AppUser;
import com.nexusml.identityservice.service.AuditService;
import com.nexusml.identityservice.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AuditService auditService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AppUser>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping("/sync")
    public ResponseEntity<AppUser> syncUser(
            @RequestBody UserSyncRequest request,
            JwtAuthenticationToken authentication) {
        AppUser user = userService.syncFromKeycloak(
            request.keycloakId(),
            request.username(),
            request.email(),
            request.role());
        return ResponseEntity.ok(user);
    }

    @GetMapping("/me")
    public ResponseEntity<AppUser> getCurrentUser(
            JwtAuthenticationToken authentication) {
        String username = authentication.getName();
        return userService.getByUsername(username)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}
