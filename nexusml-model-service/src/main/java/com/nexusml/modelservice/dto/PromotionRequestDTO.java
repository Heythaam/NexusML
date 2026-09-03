package com.nexusml.modelservice.dto;

import java.time.LocalDateTime;

public record PromotionRequestDTO(
    String id,
    String modelName,
    String modelVersion,
    String fromStage,
    String toStage,
    String requestedBy,
    LocalDateTime requestedAt,
    String comment,
    String status,
    String reviewedBy,
    LocalDateTime reviewedAt,
    String rejectionReason
) {}
