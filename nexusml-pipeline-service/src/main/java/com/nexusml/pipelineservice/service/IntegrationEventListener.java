package com.nexusml.pipelineservice.service;

import java.util.Map;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import com.nexusml.pipelineservice.config.DynamicAirflowConfig;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class IntegrationEventListener {

    private final DynamicAirflowConfig dynamicAirflowConfig;

    @RabbitListener(queues = "integration.events.pipeline-service")
    public void onIntegrationUpdated(Map<String, Object> event) {
        String id = (String) event.get("id");
        String fullUrl = (String) event.get("fullUrl");

        if ("airflow".equals(id) && fullUrl != null) {
            log.info("Airflow URL updated to: {}", fullUrl);
            dynamicAirflowConfig.updateUrl(fullUrl);
        }
    }
}
