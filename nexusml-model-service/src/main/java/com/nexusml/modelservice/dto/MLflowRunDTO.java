package com.nexusml.modelservice.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class MLflowRunDTO {
    @JsonProperty("info")
    private MLflowRunInfoDTO info;
    @JsonProperty("data")
    private MLflowRunDataDTO data;
}
