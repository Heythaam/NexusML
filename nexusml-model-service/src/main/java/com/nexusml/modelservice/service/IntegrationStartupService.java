package com.nexusml.modelservice.service;

import java.time.Duration;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.nexusml.modelservice.config.DynamicMLflowConfig;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class IntegrationStartupService {

    private final DynamicMLflowConfig dynamicConfig;
    private final WebClient.Builder webClientBuilder;

    @Value("${identity.service.url:http://localhost:8081}")
    private String identityServiceUrl;

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        try {
            // .clone() so this one-off client doesn't mutate the shared builder bean.
            WebClient identityClient = webClientBuilder.clone()
                .baseUrl(identityServiceUrl)
                .build();

            Map response = identityClient.get()
                .uri("/integrations/mlflow/url")
                .retrieve()
                .bodyToMono(Map.class)
                .block(Duration.ofSeconds(5));

            if (response != null && response.get("url") != null) {
                String url = (String) response.get("url");
                log.info("Loaded MLflow URL from identity-service: {}", url);
                dynamicConfig.updateUrl(url);
            }
        } catch (Exception e) {
            log.warn("Could not fetch MLflow URL from identity-service, using default: {}", e.getMessage());
        }
    }
}
