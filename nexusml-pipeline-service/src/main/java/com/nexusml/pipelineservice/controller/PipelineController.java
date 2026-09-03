package com.nexusml.pipelineservice.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nexusml.pipelineservice.dto.AirflowDagDTO;
import com.nexusml.pipelineservice.dto.AirflowDagRunResponse;
import com.nexusml.pipelineservice.dto.PipelineRunDTO;
import com.nexusml.pipelineservice.dto.TriggerPipelineRequest;
import com.nexusml.pipelineservice.model.PipelineRun;
import com.nexusml.pipelineservice.service.PipelineService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequiredArgsConstructor
@Slf4j
public class PipelineController {

    private final PipelineService pipelineService;

    @PostMapping("/trigger")
    @PreAuthorize("hasAnyRole('ADMIN','DATA_SCIENTIST')")
    public ResponseEntity<PipelineRunDTO> trigger(
            @Valid @RequestBody TriggerPipelineRequest request,
            JwtAuthenticationToken authentication) {
        PipelineRunDTO run = pipelineService.triggerPipeline(
            request, authentication.getToken().getClaimAsString("preferred_username"));
        return ResponseEntity.status(HttpStatus.CREATED).body(run);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','DATA_SCIENTIST','VIEWER')")
    public ResponseEntity<List<PipelineRunDTO>> getAllRuns() {
        return ResponseEntity.ok(pipelineService.getAllRuns());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DATA_SCIENTIST','VIEWER')")
    public ResponseEntity<PipelineRunDTO> getRunById(@PathVariable String id) {
        return ResponseEntity.ok(pipelineService.getRunById(id));
    }

    @GetMapping("/connection/test")
    @PreAuthorize("hasAnyRole('ADMIN', 'DATA_SCIENTIST')")
    public ResponseEntity<Map<String, Object>> testConnection() {
        return ResponseEntity.ok(pipelineService.testAirflowConnection());
    }

    @GetMapping("/dags")
    @PreAuthorize("hasAnyRole('ADMIN','DATA_SCIENTIST')")
    public ResponseEntity<List<AirflowDagDTO>> getAllDags() {
        return ResponseEntity.ok(pipelineService.getAllDags());
    }

    @GetMapping("/dags/{dagId}")
    @PreAuthorize("hasAnyRole('ADMIN','DATA_SCIENTIST')")
    public ResponseEntity<AirflowDagDTO> getDag(@PathVariable String dagId) {
        return ResponseEntity.ok(pipelineService.getDag(dagId));
    }

    @GetMapping("/dags/{dagId}/runs")
    @PreAuthorize("hasAnyRole('ADMIN','DATA_SCIENTIST','VIEWER')")
    public ResponseEntity<List<AirflowDagRunResponse>> getDagRuns(@PathVariable String dagId) {
        return ResponseEntity.ok(pipelineService.getDagRuns(dagId));
    }

    @PatchMapping("/dags/{dagId}/pause")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> togglePause(
            @PathVariable String dagId,
            @RequestParam boolean isPaused,
            JwtAuthenticationToken authentication) {
        pipelineService.toggleDagPause(dagId, isPaused);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/tasks/{taskId}/logs")
    @PreAuthorize("hasAnyRole('ADMIN','DATA_SCIENTIST')")
    public ResponseEntity<Map<String, String>> getTaskLogs(
            @PathVariable String id,
            @PathVariable String taskId,
            @RequestParam(defaultValue = "1") int tryNumber) {
        PipelineRun run = pipelineService.getRunEntityById(id);
        String logs = pipelineService.getTaskLogs(run.getDagId(), run.getDagRunId(), taskId, tryNumber);
        return ResponseEntity.ok(Map.of(
            "taskId", taskId,
            "dagRunId", run.getDagRunId(),
            "logs", logs != null ? logs : "No logs available"
        ));
    }

    @PostMapping("/{id}/fail")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> markAsFailed(
            @PathVariable String id,
            JwtAuthenticationToken authentication) {
        pipelineService.markRunAsFailed(
            id, authentication.getToken().getClaimAsString("preferred_username"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/pause-dag")
    @PreAuthorize("hasAnyRole('ADMIN','DATA_SCIENTIST')")
    public ResponseEntity<Void> pauseDag(
            @PathVariable String id,
            @RequestParam boolean isPaused,
            JwtAuthenticationToken authentication) {
        pipelineService.toggleRunDagPause(
            id, isPaused, authentication.getToken().getClaimAsString("preferred_username"));
        return ResponseEntity.ok().build();
    }
}
