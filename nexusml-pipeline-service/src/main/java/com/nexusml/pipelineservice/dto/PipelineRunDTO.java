package com.nexusml.pipelineservice.dto;

import java.time.LocalDateTime;
import java.util.List;

public record PipelineRunDTO(
    String id,
    String dagId,
    String dagRunId,
    String status,
    String triggeredBy,
    LocalDateTime triggeredAt,
    LocalDateTime completedAt,
    String dataset,
    String objective,
    int totalTasks,
    int completedTasks,
    List<TaskStatusDTO> taskStatuses
) {}
