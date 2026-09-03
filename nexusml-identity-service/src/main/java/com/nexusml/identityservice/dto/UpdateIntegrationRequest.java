package com.nexusml.identityservice.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateIntegrationRequest(
    @NotBlank String url,
    Integer port
) {}
