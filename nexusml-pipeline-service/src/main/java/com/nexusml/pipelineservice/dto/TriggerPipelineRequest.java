package com.nexusml.pipelineservice.dto;

import java.util.Map;

import jakarta.validation.constraints.NotBlank;

public record TriggerPipelineRequest(
    @NotBlank String dagId,
    String dataset,
    String objective,
    Map<String, Object> conf
) {}
