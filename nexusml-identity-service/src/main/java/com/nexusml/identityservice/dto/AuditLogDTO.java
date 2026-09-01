package com.nexusml.identityservice.dto;

import java.time.LocalDateTime;

public record AuditLogDTO(
    String id,
    String action,
    String performedBy,
    String resourceType,
    String resourceId,
    String details,
    LocalDateTime timestamp,
    String status
) {}
