package com.nexusml.identityservice.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateCredentialRequest(
    @NotBlank String name,
    @NotBlank String type,
    String description,
    @NotBlank String category,
    String value    // nullable on update, required on create
) {}
