package com.nexusml.modelservice.dto;

import jakarta.validation.constraints.NotBlank;

public record CreatePromotionRequest(
    @NotBlank String modelName,
    @NotBlank String modelVersion,
    @NotBlank String fromStage,
    @NotBlank String toStage,
    String comment
) {}
