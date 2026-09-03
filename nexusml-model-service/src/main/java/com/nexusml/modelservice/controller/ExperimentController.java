package com.nexusml.modelservice.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import com.nexusml.modelservice.config.MLflowConfig;
import com.nexusml.modelservice.dto.MLflowExperimentDTO;
import com.nexusml.modelservice.dto.MLflowRunDTO;
import com.nexusml.modelservice.service.ExperimentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class ExperimentController {

    private final ExperimentService experimentService;
    private final MLflowConfig mlflowConfig;

    @GetMapping("/experiments")
    @PreAuthorize("hasAnyRole('ADMIN','DATA_SCIENTIST','VIEWER')")
    public ResponseEntity<List<MLflowExperimentDTO>> getAllExperiments() {
        return ResponseEntity.ok(experimentService.getAllExperiments());
    }

    @GetMapping("/experiments/{experimentId}/runs")
    @PreAuthorize("hasAnyRole('ADMIN','DATA_SCIENTIST','VIEWER')")
    public ResponseEntity<List<MLflowRunDTO>> getRuns(@PathVariable String experimentId) {
        return ResponseEntity.ok(experimentService.getRunsForExperiment(experimentId));
    }

    @GetMapping("/experiments/runs")
    @PreAuthorize("hasAnyRole('ADMIN','DATA_SCIENTIST','VIEWER')")
    public ResponseEntity<List<MLflowRunDTO>> getAllRuns() {
        return ResponseEntity.ok(experimentService.getAllRuns());
    }

    @GetMapping("/experiments/runs/{runId}")
    @PreAuthorize("hasAnyRole('ADMIN','DATA_SCIENTIST','VIEWER')")
    public ResponseEntity<MLflowRunDTO> getRun(@PathVariable String runId) {
        return ResponseEntity.ok(experimentService.getRunById(runId));
    }

    @GetMapping("/experiments/connection/test")
    @PreAuthorize("hasAnyRole('ADMIN', 'DATA_SCIENTIST')")
    public ResponseEntity<Map<String, Object>> testConnection() {
        boolean connected = experimentService.testConnection();
        return ResponseEntity.ok(Map.of(
            "connected", connected,
            "mlflowUrl", mlflowConfig.getUrl(),
            "timestamp", LocalDateTime.now()
        ));
    }
}
