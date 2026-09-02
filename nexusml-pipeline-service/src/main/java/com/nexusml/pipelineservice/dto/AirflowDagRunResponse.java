package com.nexusml.pipelineservice.dto;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AirflowDagRunResponse(
    @JsonAlias("dag_run_id") String dagRunId,
    @JsonAlias("dag_id") String dagId,
    String state,
    @JsonAlias("start_date") String startDate,
    @JsonAlias("end_date") String endDate,
    Map<String, Object> conf
) {}
