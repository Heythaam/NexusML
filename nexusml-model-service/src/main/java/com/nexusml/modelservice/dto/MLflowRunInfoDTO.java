package com.nexusml.modelservice.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class MLflowRunInfoDTO {
    @JsonAlias("run_uuid")
    private String runUuid;
    @JsonAlias("run_id")
    private String runId;
    @JsonAlias("experiment_id")
    private String experimentId;
    @JsonAlias("run_name")
    private String runName;
    @JsonAlias("user_id")
    private String userId;
    private String status;
    @JsonAlias("start_time")
    private Long startTime;
    @JsonAlias("end_time")
    private Long endTime;
    @JsonAlias("artifact_uri")
    private String artifactUri;
    @JsonAlias("lifecycle_stage")
    private String lifecycleStage;
}
