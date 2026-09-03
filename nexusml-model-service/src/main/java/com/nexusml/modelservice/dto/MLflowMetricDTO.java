package com.nexusml.modelservice.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class MLflowMetricDTO {
    @JsonProperty("key")
    private String key;
    @JsonProperty("value")
    private Double value;
    @JsonProperty("timestamp")
    private Long timestamp;
    @JsonProperty("step")
    private Integer step;
}
