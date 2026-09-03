package com.nexusml.modelservice.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.nexusml.modelservice.model.PromotionRequest;

public interface PromotionRequestRepository extends JpaRepository<PromotionRequest, String> {
    List<PromotionRequest> findByStatus(String status);
    List<PromotionRequest> findByRequestedBy(String requestedBy);
    List<PromotionRequest> findByModelName(String modelName);
}
