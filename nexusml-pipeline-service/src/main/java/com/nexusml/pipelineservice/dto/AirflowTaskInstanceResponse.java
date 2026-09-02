package com.nexusml.pipelineservice.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AirflowTaskInstanceResponse(
    @JsonProperty("task_instances") List<AirflowTaskInstance> taskInstances
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record AirflowTaskInstance(
        @JsonProperty("task_id") String taskId,
        @JsonProperty("state") String state,
        @JsonProperty("start_date") String startDate,
        @JsonProperty("end_date") String endDate,
        @JsonProperty("try_number") int tryNumber
    ) {}
}
