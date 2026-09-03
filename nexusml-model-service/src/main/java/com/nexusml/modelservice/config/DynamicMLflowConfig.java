package com.nexusml.modelservice.config;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import lombok.extern.slf4j.Slf4j;

/**
 * Holds the current MLflow URL and rebuilds its WebClient whenever the URL
 * changes at runtime (via an integration.updated RabbitMQ event or the
 * identity-service startup fetch), instead of it being fixed at boot time.
 */
@Component
@Slf4j
public class DynamicMLflowConfig {

    private final WebClient.Builder webClientBuilder;

    private volatile String mlflowUrl;
    private volatile WebClient webClient;

    public DynamicMLflowConfig(MLflowConfig mlflowConfig, WebClient.Builder webClientBuilder) {
        this.mlflowUrl = mlflowConfig.getUrl();
        this.webClientBuilder = webClientBuilder;
        this.webClient = buildWebClient(mlflowUrl);
    }

    public WebClient getWebClient() {
        return webClient;
    }

    public String getMlflowUrl() {
        return mlflowUrl;
    }

    public void updateUrl(String newUrl) {
        if (newUrl.equals(mlflowUrl)) {
            return;
        }
        log.info("MLflow URL updated: {} -> {}", mlflowUrl, newUrl);
        mlflowUrl = newUrl;
        webClient = buildWebClient(newUrl);
    }

    private WebClient buildWebClient(String url) {
        // .clone() so we customize an independent copy rather than mutating
        // the shared WebClient.Builder bean (which other consumers also use).
        return webClientBuilder.clone()
            .baseUrl(url)
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .build();
    }
}
