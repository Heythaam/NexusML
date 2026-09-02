package com.nexusml.pipelineservice.dto;

import java.time.LocalDateTime;

public record TaskStatusDTO(
    String taskId,
    String state,
    LocalDateTime startDate,
    LocalDateTime endDate,
    int tryNumber
) {}
