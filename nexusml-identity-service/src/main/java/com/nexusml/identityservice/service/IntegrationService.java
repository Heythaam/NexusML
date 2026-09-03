package com.nexusml.identityservice.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.amqp.core.AmqpTemplate;
import org.springframework.stereotype.Service;

import com.nexusml.identityservice.config.RabbitMQConfig;
import com.nexusml.identityservice.dto.UpdateIntegrationRequest;
import com.nexusml.identityservice.model.IntegrationConfig;
import com.nexusml.identityservice.repository.IntegrationRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class IntegrationService {

    private final IntegrationRepository repository;
    private final AuditService auditService;
    private final AmqpTemplate amqpTemplate;

    // Default configs if DB is empty
    private static final List<IntegrationConfig> DEFAULTS = List.of(
        IntegrationConfig.builder()
            .id("airflow").name("Apache Airflow")
            .url("http://localhost").port(8080)
            .status("untested").build(),
        IntegrationConfig.builder()
            .id("mlflow").name("MLflow")
            .url("http://localhost").port(5001)
            .status("untested").build(),
        IntegrationConfig.builder()
            .id("prometheus").name("Prometheus")
            .url("http://localhost").port(9090)
            .status("untested").build(),
        IntegrationConfig.builder()
            .id("grafana").name("Grafana")
            .url("http://localhost").port(3000)
            .status("untested").build(),
        IntegrationConfig.builder()
            .id("kubernetes").name("Kubernetes API")
            .url("https://localhost").port(6443)
            .status("untested").build(),
        IntegrationConfig.builder()
            .id("slack").name("Slack Webhook")
            .url("https://hooks.slack.com").port(null)
            .status("untested").build()
    );

    public List<IntegrationConfig> getAllIntegrations() {
        List<IntegrationConfig> saved = repository.findAll();
        if (saved.isEmpty()) {
            repository.saveAll(DEFAULTS);
            return DEFAULTS;
        }
        return saved;
    }

    public IntegrationConfig getIntegration(String id) {
        return repository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Integration not found: " + id));
    }

    public IntegrationConfig updateIntegration(String id, UpdateIntegrationRequest request, String updatedBy) {
        IntegrationConfig config = repository.findById(id)
            .orElse(IntegrationConfig.builder().id(id).build());
        config.setUrl(request.url());
        config.setPort(request.port());
        config.setStatus("untested");
        config.setUpdatedBy(updatedBy);
        config.setUpdatedAt(LocalDateTime.now());
        IntegrationConfig saved = repository.save(config);
        auditService.log(
            "INTEGRATION_UPDATED", updatedBy,
            "INTEGRATION", id,
            "Updated " + id + " URL to " + request.url() + ":" + request.port(),
            "SUCCESS");
        amqpTemplate.convertAndSend(
            RabbitMQConfig.AUDIT_EXCHANGE,
            RabbitMQConfig.INTEGRATION_UPDATED_KEY,
            Map.of(
                "id", id,
                "url", request.url(),
                "port", request.port() != null ? request.port() : 0,
                "fullUrl", request.port() != null
                    ? request.url() + ":" + request.port()
                    : request.url()
            ));
        return saved;
    }

    public IntegrationConfig updateStatus(String id, String status) {
        IntegrationConfig config = repository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Integration not found: " + id));
        config.setStatus(status);
        config.setLastTested(LocalDateTime.now());
        return repository.save(config);
    }

    public String getIntegrationUrl(String id) {
        return repository.findById(id)
            .map(c -> c.getUrl() + ":" + c.getPort())
            .orElse(null);
    }
}
