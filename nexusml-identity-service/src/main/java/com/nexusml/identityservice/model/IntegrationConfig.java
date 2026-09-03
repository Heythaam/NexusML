package com.nexusml.identityservice.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "integration_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IntegrationConfig {
    @Id
    private String id; // e.g. "airflow", "mlflow", "prometheus"

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String url;

    @Column
    private Integer port;

    @Column(nullable = false)
    private String status; // connected, disconnected, error, untested

    @Column
    private LocalDateTime lastTested;

    @Column
    private String updatedBy;

    @Column
    private LocalDateTime updatedAt;
}
