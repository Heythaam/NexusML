package com.nexusml.pipelineservice.dto;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AirflowDagDTO(
    @JsonAlias("dag_id") String dagId,
    @JsonAlias("dag_display_name") String displayName,
    String description,
    @JsonAlias("is_paused") boolean isPaused,
    @JsonAlias("is_active") boolean isActive,
    @JsonAlias("schedule_interval") Object scheduleInterval,
    List<Map<String, String>> tags,
    List<String> owners,
    @JsonAlias("has_import_errors") boolean hasImportErrors,
    @JsonAlias("timetable_description") String timetableDescription
) {}
