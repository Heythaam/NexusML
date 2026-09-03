package com.nexusml.pipelineservice.service;

import java.time.Duration;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.nexusml.pipelineservice.config.DynamicAirflowConfig;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AirflowStartupService {

    private final DynamicAirflowConfig dynamicAirflowConfig;
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
                .uri("/integrations/airflow/url")
                .retrieve()
                .bodyToMono(Map.class)
                .block(Duration.ofSeconds(5));

            if (response != null && response.get("url") != null) {
                String url = (String) response.get("url");
                log.info("Loaded Airflow URL from identity-service: {}", url);
                dynamicAirflowConfig.updateUrl(url);
            }
        } catch (Exception e) {
            log.warn("Could not fetch Airflow URL from identity-service, using default: {}", e.getMessage());
        }
    }
}
