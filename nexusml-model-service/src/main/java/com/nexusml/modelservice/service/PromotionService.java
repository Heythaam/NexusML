package com.nexusml.modelservice.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.amqp.core.AmqpTemplate;
import org.springframework.stereotype.Service;

import com.nexusml.modelservice.config.RabbitMQConfig;
import com.nexusml.modelservice.dto.CreatePromotionRequest;
import com.nexusml.modelservice.dto.PromotionRequestDTO;
import com.nexusml.modelservice.model.PromotionRequest;
import com.nexusml.modelservice.repository.PromotionRequestRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class PromotionService {

    private final PromotionRequestRepository repository;
    private final MLflowClient mlflowClient;
    private final AmqpTemplate amqpTemplate;

    public PromotionRequestDTO createRequest(CreatePromotionRequest request, String requestedBy) {
        PromotionRequest promotion = PromotionRequest.builder()
            .modelName(request.modelName())
            .modelVersion(request.modelVersion())
            .fromStage(request.fromStage())
            .toStage(request.toStage())
            .requestedBy(requestedBy)
            .requestedAt(LocalDateTime.now())
            .comment(request.comment())
            .status("pending")
            .build();
        PromotionRequest saved = repository.save(promotion);
        log.info("Promotion request created: {} v{} by {}",
            request.modelName(), request.modelVersion(), requestedBy);
        return toDTO(saved);
    }

    public PromotionRequestDTO approveRequest(String id, String approvedBy) {
        PromotionRequest request = repository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Promotion request not found: " + id));

        if (!"pending".equals(request.getStatus())) {
            throw new IllegalStateException("Request is not pending");
        }

        // Transition stage in MLflow
        mlflowClient.transitionModelStage(
            request.getModelName(),
            request.getModelVersion(),
            request.getToStage());

        // Update request
        request.setStatus("approved");
        request.setReviewedBy(approvedBy);
        request.setReviewedAt(LocalDateTime.now());
        PromotionRequest saved = repository.save(request);

        // Publish event to RabbitMQ
        amqpTemplate.convertAndSend(
            RabbitMQConfig.NEXUSML_EXCHANGE,
            RabbitMQConfig.MODEL_PROMOTED_KEY,
            Map.of(
                "modelName", request.getModelName(),
                "modelVersion", request.getModelVersion(),
                "fromStage", request.getFromStage(),
                "toStage", request.getToStage(),
                "approvedBy", approvedBy
            ));

        log.info("Model {} v{} promoted to {} by {}",
            request.getModelName(), request.getModelVersion(),
            request.getToStage(), approvedBy);
        return toDTO(saved);
    }

    public PromotionRequestDTO rejectRequest(String id, String rejectedBy, String reason) {
        PromotionRequest request = repository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Promotion request not found: " + id));

        request.setStatus("rejected");
        request.setReviewedBy(rejectedBy);
        request.setReviewedAt(LocalDateTime.now());
        request.setRejectionReason(reason);
        PromotionRequest saved = repository.save(request);

        log.info("Promotion request {} rejected by {}", id, rejectedBy);
        return toDTO(saved);
    }

    public List<PromotionRequestDTO> getAllRequests() {
        return repository.findAll().stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public List<PromotionRequestDTO> getPendingRequests() {
        return repository.findByStatus("pending").stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    private PromotionRequestDTO toDTO(PromotionRequest r) {
        return new PromotionRequestDTO(
            r.getId(), r.getModelName(), r.getModelVersion(), r.getFromStage(),
            r.getToStage(), r.getRequestedBy(), r.getRequestedAt(), r.getComment(),
            r.getStatus(), r.getReviewedBy(), r.getReviewedAt(), r.getRejectionReason());
    }
}
