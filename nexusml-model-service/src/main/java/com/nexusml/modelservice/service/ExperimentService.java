package com.nexusml.modelservice.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.nexusml.modelservice.dto.MLflowExperimentDTO;
import com.nexusml.modelservice.dto.MLflowRunDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExperimentService {

    private final MLflowClient mlflowClient;

    public List<MLflowExperimentDTO> getAllExperiments() {
        return mlflowClient.searchExperiments();
    }

    public List<MLflowRunDTO> getRunsForExperiment(String experimentId) {
        return mlflowClient.searchRuns(List.of(experimentId));
    }

    public List<MLflowRunDTO> getAllRuns() {
        List<MLflowExperimentDTO> experiments = mlflowClient.searchExperiments();
        List<String> ids = experiments.stream()
            .map(MLflowExperimentDTO::getExperimentId)
            .collect(Collectors.toList());
        if (ids.isEmpty()) return List.of();
        return mlflowClient.searchRuns(ids);
    }

    public MLflowRunDTO getRunById(String runId) {
        return mlflowClient.getRun(runId);
    }

    public boolean testConnection() {
        return mlflowClient.testConnection();
    }
}
