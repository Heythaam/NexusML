package com.nexusml.pipelineservice.config;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient airflowWebClient(AirflowConfig config) {
        String credentials = Base64.getEncoder()
            .encodeToString(
                (config.getUsername() + ":" + config.getPassword())
                    .getBytes(StandardCharsets.UTF_8));
        return WebClient.builder()
            .baseUrl(config.getUrl())
            .defaultHeader(HttpHeaders.AUTHORIZATION, "Basic " + credentials)
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .build();
    }
}
