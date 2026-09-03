package com.nexusml.modelservice.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "promotion_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String modelName;

    @Column(nullable = false)
    private String modelVersion;

    @Column(nullable = false)
    private String fromStage;

    @Column(nullable = false)
    private String toStage;

    @Column(nullable = false)
    private String requestedBy;

    @Column(nullable = false)
    private LocalDateTime requestedAt;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(nullable = false)
    private String status; // pending, approved, rejected

    @Column
    private String reviewedBy;

    @Column
    private LocalDateTime reviewedAt;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;
}
