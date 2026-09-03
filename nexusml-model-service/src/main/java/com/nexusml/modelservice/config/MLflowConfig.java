package com.nexusml.modelservice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "mlflow")
@Data
public class MLflowConfig {
    private String url;
}
