package com.nexusml.identityservice.dto;

public record UserSyncRequest(
    String keycloakId,
    String username,
    String email,
    String role
) {}
