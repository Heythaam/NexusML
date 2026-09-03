package com.nexusml.modelservice.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class MLflowParamDTO {
    @JsonProperty("key")
    private String key;
    @JsonProperty("value")
    private String value;
}
