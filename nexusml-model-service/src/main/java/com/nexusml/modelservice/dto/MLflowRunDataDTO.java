package com.nexusml.modelservice.dto;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class MLflowRunDataDTO {
    @JsonProperty("metrics")
    private List<MLflowMetricDTO> metrics = new ArrayList<>();
    @JsonProperty("params")
    private List<MLflowParamDTO> params = new ArrayList<>();
    @JsonProperty("tags")
    private List<MLflowTagDTO> tags = new ArrayList<>();
}
