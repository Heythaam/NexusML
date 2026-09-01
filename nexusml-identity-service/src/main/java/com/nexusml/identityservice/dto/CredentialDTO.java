package com.nexusml.identityservice.dto;

import java.time.LocalDateTime;

public record CredentialDTO(
    String id,
    String name,
    String type,
    String createdBy,
    LocalDateTime createdAt
) {}
