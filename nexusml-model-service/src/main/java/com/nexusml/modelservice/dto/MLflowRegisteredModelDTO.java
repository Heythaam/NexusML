package com.nexusml.modelservice.dto;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class MLflowRegisteredModelDTO {
    private String name;
    @JsonAlias("creation_timestamp")
    private Long creationTimestamp;
    @JsonAlias("last_updated_timestamp")
    private Long lastUpdatedTimestamp;
    private String description;
    @JsonAlias("latest_versions")
    private List<MLflowModelVersionDTO> latestVersions = new ArrayList<>();
}
