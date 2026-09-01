package com.nexusml.identityservice.dto;

import java.time.LocalDateTime;

public record CredentialDTO(
    String id,
    String name,
    String type,
    String description,
    String category,
    String createdBy,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
