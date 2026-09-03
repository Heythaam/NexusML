package com.nexusml.pipelineservice.config;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import lombok.extern.slf4j.Slf4j;

/**
 * Holds the current Airflow URL and rebuilds its WebClient whenever the URL
 * changes at runtime (via an integration.updated RabbitMQ event or the
 * identity-service startup fetch), instead of it being fixed at boot time.
 * Basic Auth credentials come from AirflowConfig and stay fixed — only the
 * URL is updated dynamically.
 */
@Component
@Slf4j
public class DynamicAirflowConfig {

    private final String credentials;
    private final WebClient.Builder webClientBuilder;

    private volatile String airflowUrl;
    private volatile WebClient webClient;

    public DynamicAirflowConfig(AirflowConfig airflowConfig, WebClient.Builder webClientBuilder) {
        this.airflowUrl = airflowConfig.getUrl();
        this.credentials = Base64.getEncoder()
            .encodeToString((airflowConfig.getUsername() + ":" + airflowConfig.getPassword())
                .getBytes(StandardCharsets.UTF_8));
        this.webClientBuilder = webClientBuilder;
        this.webClient = buildWebClient(airflowUrl);
    }

    public WebClient getWebClient() {
        return webClient;
    }

    public String getAirflowUrl() {
        return airflowUrl;
    }

    public void updateUrl(String newUrl) {
        if (newUrl.equals(airflowUrl)) {
            return;
        }
        log.info("Airflow URL updated: {} -> {}", airflowUrl, newUrl);
        airflowUrl = newUrl;
        webClient = buildWebClient(newUrl);
    }

    private WebClient buildWebClient(String url) {
        // .clone() so we customize an independent copy rather than mutating
        // the shared WebClient.Builder bean (which other consumers also use).
        return webClientBuilder.clone()
            .baseUrl(url)
            .defaultHeader(HttpHeaders.AUTHORIZATION, "Basic " + credentials)
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .build();
    }
}
