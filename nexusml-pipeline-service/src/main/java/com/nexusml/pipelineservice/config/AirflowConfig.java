package com.nexusml.pipelineservice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "airflow")
@Data
public class AirflowConfig {
    private String url;
    private String username;
    private String password;
    private String dagId;
    private int pollIntervalSeconds;
}
