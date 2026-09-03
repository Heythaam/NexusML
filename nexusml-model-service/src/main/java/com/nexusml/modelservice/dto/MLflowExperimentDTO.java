package com.nexusml.modelservice.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class MLflowExperimentDTO {
    @JsonAlias("experiment_id")
    private String experimentId;
    private String name;
    @JsonAlias("artifact_location")
    private String artifactLocation;
    @JsonAlias("lifecycle_stage")
    private String lifecycleStage;
    @JsonAlias("last_update_time")
    private Long lastUpdateTime;
    @JsonAlias("creation_time")
    private Long creationTime;
}
