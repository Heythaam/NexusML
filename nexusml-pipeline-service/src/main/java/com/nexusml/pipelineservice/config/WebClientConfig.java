package com.nexusml.pipelineservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    // DynamicAirflowConfig owns the actual airflow WebClient (rebuilt when the
    // URL changes at runtime), so this just exposes the shared builder template.
    @Bean
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder()
            .codecs(c -> c.defaultCodecs().maxInMemorySize(10 * 1024 * 1024));
    }
}
