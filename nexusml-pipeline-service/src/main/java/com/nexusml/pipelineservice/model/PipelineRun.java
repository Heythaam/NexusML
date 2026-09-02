package com.nexusml.pipelineservice.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GenerationType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "pipeline_runs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PipelineRun {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String dagId;

    @Column(nullable = false)
    private String dagRunId;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private String triggeredBy;

    @Column(nullable = false)
    private LocalDateTime triggeredAt;

    @Column
    private LocalDateTime completedAt;

    @Column(columnDefinition = "TEXT")
    private String conf;

    @Column
    private String dataset;

    @Column
    private String objective;

    @Column(nullable = false)
    private int totalTasks;

    @Column(nullable = false)
    private int completedTasks;

    @Column(columnDefinition = "TEXT")
    private String taskStatuses;
}
