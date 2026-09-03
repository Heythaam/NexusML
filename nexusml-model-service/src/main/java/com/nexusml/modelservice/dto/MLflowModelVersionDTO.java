package com.nexusml.modelservice.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class MLflowModelVersionDTO {
    private String name;
    private String version;
    @JsonAlias("creation_timestamp")
    private Long creationTimestamp;
    @JsonAlias("last_updated_timestamp")
    private Long lastUpdatedTimestamp;
    @JsonAlias("current_stage")
    private String currentStage;
    private String description;
    private String source;
    @JsonAlias("run_id")
    private String runId;
    private String status;
}
