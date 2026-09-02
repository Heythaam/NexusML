package com.nexusml.pipelineservice.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.amqp.core.AmqpTemplate;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexusml.pipelineservice.config.AirflowConfig;
import com.nexusml.pipelineservice.config.RabbitMQConfig;
import com.nexusml.pipelineservice.dto.AirflowDagDTO;
import com.nexusml.pipelineservice.dto.AirflowDagRunResponse;
import com.nexusml.pipelineservice.dto.AirflowTaskInstanceResponse;
import com.nexusml.pipelineservice.dto.PipelineRunDTO;
import com.nexusml.pipelineservice.dto.TaskStatusDTO;
import com.nexusml.pipelineservice.dto.TriggerPipelineRequest;
import com.nexusml.pipelineservice.model.PipelineRun;
import com.nexusml.pipelineservice.repository.PipelineRunRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class PipelineService {

    private final AirflowClient airflowClient;
    private final PipelineRunRepository repository;
    private final AmqpTemplate amqpTemplate;
    private final ObjectMapper objectMapper;
    private final AirflowConfig airflowConfig;

    public PipelineRunDTO triggerPipeline(TriggerPipelineRequest request, String triggeredBy) {
        Map<String, Object> conf = new HashMap<>();
        if (request.dataset() != null && !request.dataset().isBlank()) {
            conf.put("RAW_DATA_FILE", request.dataset());
        }
        conf.put("MLFLOW_TRACKING_URI", "http://mlflow:5000");
        conf.put("objective", request.objective() != null ? request.objective() : "f1_score");
        if (request.conf() != null) {
            conf.putAll(request.conf());
        }

        AirflowDagRunResponse response = airflowClient.triggerDag(request.dagId(), conf);

        PipelineRun run = PipelineRun.builder()
            .dagId(request.dagId())
            .dagRunId(response.dagRunId())
            .status("running")
            .triggeredBy(triggeredBy)
            .triggeredAt(LocalDateTime.now())
            .dataset(request.dataset())
            .objective(request.objective() != null ? request.objective() : "f1_score")
            .totalTasks(0)
            .completedTasks(0)
            .conf(conf.toString())
            .build();
        PipelineRun saved = repository.save(run);

        amqpTemplate.convertAndSend(
            RabbitMQConfig.NEXUSML_EXCHANGE,
            RabbitMQConfig.PIPELINE_TRIGGERED_KEY,
            Map.of(
                "runId", saved.getId(),
                "dagId", request.dagId(),
                "dagRunId", response.dagRunId(),
                "triggeredBy", triggeredBy,
                "dataset", request.dataset() != null ? request.dataset() : ""
            ));

        log.info("Pipeline triggered: {} ({}) by {}", response.dagRunId(), request.dagId(), triggeredBy);
        return toDTO(saved, List.of());
    }

    public List<AirflowDagDTO> getAllDags() {
        return airflowClient.getAllDags();
    }

    public AirflowDagDTO getDag(String dagId) {
        return airflowClient.getDag(dagId);
    }

    public List<AirflowDagRunResponse> getDagRuns(String dagId) {
        return airflowClient.getDagRuns(dagId);
    }

    public void toggleDagPause(String dagId, boolean isPaused) {
        airflowClient.pauseDag(dagId, isPaused);
    }

    public List<PipelineRunDTO> getAllRuns() {
        return repository.findAllByOrderByTriggeredAtDesc()
            .stream()
            .map(run -> toDTO(run, List.of()))
            .collect(Collectors.toList());
    }

    public PipelineRunDTO getRunById(String id) {
        return enrichWithTaskStatuses(getRunEntityById(id));
    }

    public PipelineRun getRunEntityById(String id) {
        return repository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Pipeline run not found: " + id));
    }

    public String getTaskLogs(String dagId, String dagRunId, String taskId, int tryNumber) {
        return airflowClient.getTaskLogs(dagId, dagRunId, taskId, tryNumber);
    }

    public void markRunAsFailed(String id, String markedBy) {
        PipelineRun run = getRunEntityById(id);
        airflowClient.markDagRunFailed(run.getDagId(), run.getDagRunId());
        run.setStatus("failed");
        run.setCompletedAt(LocalDateTime.now());
        repository.save(run);
        log.info("Audit: PIPELINE_MARKED_FAILED by {} - Manually marked as failed: {}", markedBy, run.getDagRunId());
    }

    public void toggleRunDagPause(String id, boolean isPaused, String username) {
        PipelineRun run = getRunEntityById(id);
        if (isPaused) {
            airflowClient.pauseDagRun(run.getDagId());
        } else {
            airflowClient.unpauseDagRun(run.getDagId());
        }
        log.info("Audit: {} by {} - {} DAG: {}",
            isPaused ? "PIPELINE_PAUSED" : "PIPELINE_UNPAUSED",
            username,
            isPaused ? "Paused" : "Unpaused",
            run.getDagId());
    }

    public PipelineRunDTO enrichWithTaskStatuses(PipelineRun run) {
        try {
            AirflowTaskInstanceResponse tasks =
                airflowClient.getTaskInstances(run.getDagId(), run.getDagRunId());
            List<TaskStatusDTO> taskStatuses = tasks.taskInstances().stream()
                .map(t -> new TaskStatusDTO(
                    t.taskId(),
                    t.state() != null ? t.state() : "none",
                    parseDate(t.startDate()),
                    parseDate(t.endDate()),
                    t.tryNumber()))
                .collect(Collectors.toList());

            run.setTotalTasks(taskStatuses.size());
            long completed = taskStatuses.stream()
                .filter(t -> "success".equals(t.state()))
                .count();
            run.setCompletedTasks((int) completed);

            AirflowDagRunResponse dagStatus =
                airflowClient.getDagRunStatus(run.getDagId(), run.getDagRunId());
            if ("success".equals(dagStatus.state()) || "failed".equals(dagStatus.state())) {
                run.setStatus(dagStatus.state());
                run.setCompletedAt(LocalDateTime.now());
            }
            repository.save(run);
            return toDTO(run, taskStatuses);
        } catch (Exception e) {
            log.error("Failed to get task statuses: {}", e.getMessage());
            return toDTO(run, List.of());
        }
    }

    public Map<String, Object> testAirflowConnection() {
        boolean connected = airflowClient.testConnection();
        int dagCount = 0;
        if (connected) {
            try {
                dagCount = airflowClient.getAllDags().size();
            } catch (Exception e) {
                log.warn("Could not count DAGs: {}", e.getMessage());
            }
        }
        return Map.of(
            "connected", connected,
            "airflowUrl", airflowConfig.getUrl(),
            "dagCount", dagCount,
            "timestamp", LocalDateTime.now()
        );
    }

    private LocalDateTime parseDate(String date) {
        if (date == null) {
            return null;
        }
        try {
            return LocalDateTime.parse(date, DateTimeFormatter.ISO_DATE_TIME);
        } catch (Exception e) {
            return null;
        }
    }

    private PipelineRunDTO toDTO(PipelineRun run, List<TaskStatusDTO> tasks) {
        return new PipelineRunDTO(
            run.getId(),
            run.getDagId(),
            run.getDagRunId(),
            run.getStatus(),
            run.getTriggeredBy(),
            run.getTriggeredAt(),
            run.getCompletedAt(),
            run.getDataset(),
            run.getObjective(),
            run.getTotalTasks(),
            run.getCompletedTasks(),
            tasks);
    }
}
