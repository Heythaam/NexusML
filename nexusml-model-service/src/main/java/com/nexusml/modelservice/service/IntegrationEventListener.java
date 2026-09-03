package com.nexusml.modelservice.service;

import java.util.Map;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import com.nexusml.modelservice.config.DynamicMLflowConfig;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class IntegrationEventListener {

    private final DynamicMLflowConfig dynamicConfig;

    @RabbitListener(queues = "integration.events.model-service")
    public void onIntegrationUpdated(Map<String, Object> event) {
        String id = (String) event.get("id");
        String fullUrl = (String) event.get("fullUrl");

        if ("mlflow".equals(id) && fullUrl != null) {
            log.info("Received integration update for mlflow: {}", fullUrl);
            dynamicConfig.updateUrl(fullUrl);
        }
    }
}
