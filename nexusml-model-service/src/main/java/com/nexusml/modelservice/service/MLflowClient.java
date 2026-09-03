package com.nexusml.modelservice.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexusml.modelservice.config.DynamicMLflowConfig;
import com.nexusml.modelservice.dto.MLflowExperimentDTO;
import com.nexusml.modelservice.dto.MLflowModelVersionDTO;
import com.nexusml.modelservice.dto.MLflowRegisteredModelDTO;
import com.nexusml.modelservice.dto.MLflowRunDTO;
import com.nexusml.modelservice.dto.ModelSignatureDTO;
import com.nexusml.modelservice.dto.SignatureFieldDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings({"unchecked", "rawtypes"})
public class MLflowClient {

    private final DynamicMLflowConfig dynamicConfig;
    private final ObjectMapper mapper = new ObjectMapper();

    // Search experiments
    public List<MLflowExperimentDTO> searchExperiments() {
        try {
            Map<String, Object> body = Map.of("max_results", 100);
            Map response = dynamicConfig.getWebClient().post()
                .uri("/api/2.0/mlflow/experiments/search")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
            List<Map> exps = (List<Map>) response.get("experiments");
            if (exps == null) return List.of();
            return exps.stream()
                .map(e -> mapper.convertValue(e, MLflowExperimentDTO.class))
                .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Failed to search experiments: {}", e.getMessage());
            return List.of();
        }
    }

    // Search runs in experiment
    public List<MLflowRunDTO> searchRuns(List<String> experimentIds) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("experiment_ids", experimentIds);
            body.put("max_results", 50);
            body.put("order_by", List.of("attributes.start_time DESC"));
            Map response = dynamicConfig.getWebClient().post()
                .uri("/api/2.0/mlflow/runs/search")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
            List<Map> runs = (List<Map>) response.get("runs");
            if (runs == null) return List.of();
            return runs.stream()
                .map(r -> mapper.convertValue(r, MLflowRunDTO.class))
                .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Failed to search runs: {}", e.getMessage());
            return List.of();
        }
    }

    // Get single run
    public MLflowRunDTO getRun(String runId) {
        try {
            Map response = dynamicConfig.getWebClient().get()
                .uri("/api/2.0/mlflow/runs/get?run_id={id}", runId)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
            return mapper.convertValue(response.get("run"), MLflowRunDTO.class);
        } catch (Exception e) {
            log.error("Failed to get run {}: {}", runId, e.getMessage());
            return null;
        }
    }

    // Get registered models — MLflow 3.x uses GET
    public List<MLflowRegisteredModelDTO> getRegisteredModels() {
        try {
            Map response = dynamicConfig.getWebClient().get()
                .uri("/api/2.0/mlflow/registered-models/search?max_results=100")
                .retrieve()
                .bodyToMono(Map.class)
                .block();
            List<Map> models = (List<Map>) response.get("registered_models");
            if (models == null) return List.of();
            return models.stream()
                .map(m -> mapper.convertValue(m, MLflowRegisteredModelDTO.class))
                .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Failed to get registered models: {}", e.getMessage());
            return List.of();
        }
    }

    // Get model versions
    public List<MLflowModelVersionDTO> getModelVersions(String modelName) {
        try {
            String filter = "name='" + modelName + "'";
            Map response = dynamicConfig.getWebClient().get()
                .uri(uriBuilder -> uriBuilder
                    .path("/api/2.0/mlflow/model-versions/search")
                    .queryParam("filter", filter)
                    .queryParam("max_results", 20)
                    .build())
                .retrieve()
                .bodyToMono(Map.class)
                .block();
            List<Map> versions = (List<Map>) response.get("model_versions");
            if (versions == null) return List.of();
            return versions.stream()
                .map(v -> mapper.convertValue(v, MLflowModelVersionDTO.class))
                .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Failed to get model versions: {}", e.getMessage());
            return List.of();
        }
    }

    // Transition model version stage
    public void transitionModelStage(String modelName, String version, String stage) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("name", modelName);
            body.put("version", version);
            body.put("stage", stage);
            body.put("archive_existing_versions", false);
            dynamicConfig.getWebClient().post()
                .uri("/api/2.0/mlflow/model-versions/transition-stage")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
        } catch (Exception e) {
            log.error("Failed to transition stage: {}", e.getMessage());
            throw new RuntimeException("Failed to transition model stage: " + e.getMessage());
        }
    }

    // Get model signature — resolves the logged model's real artifact location
    // first (rather than assuming a fixed experiment id) so it works for any
    // model regardless of which experiment it was logged under.
    public ModelSignatureDTO getModelSignature(String modelId) {
        try {
            Map response = dynamicConfig.getWebClient().get()
                .uri("/api/2.0/mlflow/logged-models/{modelId}", modelId)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
            Map model = (Map) response.get("model");
            Map info = model != null ? (Map) model.get("info") : null;
            String artifactUri = info != null ? (String) info.get("artifact_uri") : null;
            if (artifactUri == null || !artifactUri.startsWith("mlflow-artifacts:/")) {
                log.error("Unexpected or missing artifact_uri for model {}: {}", modelId, artifactUri);
                return null;
            }
            String relativePath = artifactUri.substring("mlflow-artifacts:/".length());

            String yaml = dynamicConfig.getWebClient().get()
                .uri("/api/2.0/mlflow-artifacts/artifacts/" + relativePath + "/MLmodel")
                .header("Accept", "text/plain, */*")
                .retrieve()
                .bodyToMono(String.class)
                .block();

            return parseSignatureFromYaml(yaml);
        } catch (Exception e) {
            log.error("Failed to get model signature for {}: {}", modelId, e.getMessage());
            return null;
        }
    }

    private ModelSignatureDTO parseSignatureFromYaml(String yaml) {
        if (yaml == null) return null;
        try {
            List<SignatureFieldDTO> inputs = new ArrayList<>();
            List<SignatureFieldDTO> outputs = new ArrayList<>();

            String[] lines = yaml.split("\n");
            boolean inSignature = false;
            String inputsJson = null;
            String outputsJson = null;
            String flavorName = null;
            String sklearnVersion = null;
            String mlflowVersion = null;
            String modelId = null;

            for (int i = 0; i < lines.length; i++) {
                String line = lines[i];
                String trimmed = line.trim();

                if (trimmed.equals("signature:")) {
                    inSignature = true;
                    continue;
                }
                // The signature block ends once a non-indented (top-level) key follows.
                if (inSignature && !trimmed.isEmpty() && !line.startsWith(" ")) {
                    inSignature = false;
                }

                if (inSignature && trimmed.startsWith("inputs:")) {
                    int consumed = i;
                    StringBuilder sb = new StringBuilder(trimmed.substring("inputs:".length()).trim());
                    while (sb.lastIndexOf("]'") == -1 && consumed + 1 < lines.length) {
                        consumed++;
                        sb.append(' ').append(lines[consumed].trim());
                    }
                    inputsJson = extractJsonArray(sb.toString());
                    i = consumed;
                    continue;
                }
                if (inSignature && trimmed.startsWith("outputs:")) {
                    int consumed = i;
                    StringBuilder sb = new StringBuilder(trimmed.substring("outputs:".length()).trim());
                    while (sb.lastIndexOf("]'") == -1 && consumed + 1 < lines.length) {
                        consumed++;
                        sb.append(' ').append(lines[consumed].trim());
                    }
                    outputsJson = extractJsonArray(sb.toString());
                    i = consumed;
                    continue;
                }

                if (trimmed.startsWith("sklearn_version:")) {
                    sklearnVersion = trimmed.substring(trimmed.indexOf(':') + 1).trim();
                }
                if (trimmed.startsWith("mlflow_version:")) {
                    mlflowVersion = trimmed.substring(trimmed.indexOf(':') + 1).trim();
                }
                if (trimmed.startsWith("model_id:")) {
                    modelId = trimmed.substring(trimmed.indexOf(':') + 1).trim();
                }
                if (line.contains("loader_module:")) {
                    flavorName = line.substring(line.indexOf(':') + 1).trim().replace("mlflow.", "");
                }
            }

            // Parse inputs JSON
            if (inputsJson != null) {
                List<Map> inputList = mapper.readValue(
                    inputsJson,
                    mapper.getTypeFactory().constructCollectionType(List.class, Map.class));
                for (Map field : inputList) {
                    inputs.add(new SignatureFieldDTO(
                        (String) field.get("name"),
                        (String) field.get("type"),
                        field.get("required") != null ? (Boolean) field.get("required") : true,
                        null
                    ));
                }
            }

            // Parse outputs JSON
            if (outputsJson != null) {
                List<Map> outputList = mapper.readValue(
                    outputsJson,
                    mapper.getTypeFactory().constructCollectionType(List.class, Map.class));
                for (Map field : outputList) {
                    String type = field.get("type") != null ? (String) field.get("type") : "tensor";
                    String name = field.get("name") != null ? (String) field.get("name") : "prediction";
                    outputs.add(new SignatureFieldDTO(
                        name, type, false,
                        field.get("tensor-spec") != null ? field.get("tensor-spec").toString() : null
                    ));
                }
            }

            return new ModelSignatureDTO(inputs, outputs, flavorName, sklearnVersion, mlflowVersion, modelId);
        } catch (Exception e) {
            log.error("Failed to parse signature YAML: {}", e.getMessage());
            return null;
        }
    }

    private String extractJsonArray(String s) {
        int start = s.indexOf('[');
        int end = s.lastIndexOf(']');
        if (start == -1 || end == -1 || end < start) return null;
        return s.substring(start, end + 1);
    }

    // Test connection
    public boolean testConnection() {
        try {
            dynamicConfig.getWebClient().get()
                .uri("/api/2.0/mlflow/experiments/search?max_results=1")
                .retrieve()
                .bodyToMono(String.class)
                .block();
            return true;
        } catch (Exception e) {
            log.error("MLflow connection test failed: {}", e.getMessage());
            return false;
        }
    }
}
