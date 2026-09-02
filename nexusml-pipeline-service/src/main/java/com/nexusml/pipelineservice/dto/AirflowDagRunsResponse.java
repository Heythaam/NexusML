package com.nexusml.pipelineservice.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AirflowDagRunsResponse(
    @JsonProperty("dag_runs") List<AirflowDagRunResponse> dagRuns,
    @JsonProperty("total_entries") int totalEntries
) {}
