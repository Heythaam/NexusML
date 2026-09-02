package com.nexusml.pipelineservice.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.nexusml.pipelineservice.dto.AirflowDagDTO;
import com.nexusml.pipelineservice.dto.AirflowDagRunResponse;
import com.nexusml.pipelineservice.dto.AirflowDagRunsResponse;
import com.nexusml.pipelineservice.dto.AirflowDagsResponse;
import com.nexusml.pipelineservice.dto.AirflowTaskInstanceResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AirflowClient {

    private final WebClient airflowWebClient;

    public AirflowDagRunResponse triggerDag(String dagId, Map<String, Object> conf) {
        Map<String, Object> body = new HashMap<>();
        body.put("conf", conf != null ? conf : new HashMap<>());

        return airflowWebClient.post()
            .uri("/api/v1/dags/{dagId}/dagRuns", dagId)
            .bodyValue(body)
            .retrieve()
            .bodyToMono(AirflowDagRunResponse.class)
            .block();
    }

    public AirflowDagRunResponse getDagRunStatus(String dagId, String dagRunId) {
        return airflowWebClient.get()
            .uri("/api/v1/dags/{dagId}/dagRuns/{dagRunId}", dagId, dagRunId)
            .retrieve()
            .bodyToMono(AirflowDagRunResponse.class)
            .block();
    }

    public AirflowTaskInstanceResponse getTaskInstances(String dagId, String dagRunId) {
        return airflowWebClient.get()
            .uri("/api/v1/dags/{dagId}/dagRuns/{dagRunId}/taskInstances", dagId, dagRunId)
            .retrieve()
            .bodyToMono(AirflowTaskInstanceResponse.class)
            .block();
    }

    public List<AirflowDagDTO> getAllDags() {
        return airflowWebClient.get()
            .uri("/api/v1/dags?limit=100")
            .retrieve()
            .bodyToMono(AirflowDagsResponse.class)
            .map(AirflowDagsResponse::dags)
            .block();
    }

    public AirflowDagDTO getDag(String dagId) {
        return airflowWebClient.get()
            .uri("/api/v1/dags/{dagId}", dagId)
            .retrieve()
            .bodyToMono(AirflowDagDTO.class)
            .block();
    }

    public List<AirflowDagRunResponse> getDagRuns(String dagId) {
        return airflowWebClient.get()
            .uri("/api/v1/dags/{dagId}/dagRuns?limit=10&order_by=-start_date", dagId)
            .retrieve()
            .bodyToMono(AirflowDagRunsResponse.class)
            .map(AirflowDagRunsResponse::dagRuns)
            .block();
    }

    public void pauseDag(String dagId, boolean isPaused) {
        Map<String, Object> body = Map.of("is_paused", isPaused);
        airflowWebClient.patch()
            .uri("/api/v1/dags/{dagId}", dagId)
            .bodyValue(body)
            .retrieve()
            .bodyToMono(String.class)
            .block();
    }

    public void pauseDagRun(String dagId) {
        pauseDag(dagId, true);
    }

    public void unpauseDagRun(String dagId) {
        pauseDag(dagId, false);
    }

    public String getTaskLogs(String dagId, String dagRunId, String taskId, int tryNumber) {
        try {
            return airflowWebClient.get()
                .uri("/api/v1/dags/{dagId}/dagRuns/{dagRunId}/taskInstances/{taskId}/logs/{tryNumber}",
                    dagId, dagRunId, taskId, tryNumber)
                .header("Accept", "text/plain")
                .retrieve()
                .bodyToMono(String.class)
                .block();
        } catch (Exception e) {
            log.error("Failed to get logs for task {}: {}", taskId, e.getMessage());
            return "No logs available for this task.";
        }
    }

    public void markDagRunFailed(String dagId, String dagRunId) {
        Map<String, Object> body = Map.of("state", "failed");
        airflowWebClient.patch()
            .uri("/api/v1/dags/{dagId}/dagRuns/{dagRunId}", dagId, dagRunId)
            .bodyValue(body)
            .retrieve()
            .bodyToMono(String.class)
            .block();
    }

    public boolean testConnection() {
        try {
            airflowWebClient.get()
                .uri("/api/v1/health")
                .retrieve()
                .bodyToMono(String.class)
                .block();
            return true;
        } catch (Exception e) {
            log.error("Airflow connection test failed: {}", e.getMessage());
            return false;
        }
    }
}
