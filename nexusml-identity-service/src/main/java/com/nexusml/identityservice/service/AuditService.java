package com.nexusml.identityservice.service;

import com.nexusml.identityservice.config.RabbitMQConfig;
import com.nexusml.identityservice.model.AuditLog;
import com.nexusml.identityservice.repository.AuditRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.core.AmqpTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditRepository auditRepository;
    private final AmqpTemplate amqpTemplate;

    public void log(String action, String performedBy,
            String resourceType, String resourceId,
            String details, String status) {
        AuditLog log = AuditLog.builder()
            .action(action)
            .performedBy(performedBy)
            .resourceType(resourceType)
            .resourceId(resourceId)
            .details(details)
            .timestamp(LocalDateTime.now())
            .status(status)
            .build();
        auditRepository.save(log);
        amqpTemplate.convertAndSend(
            RabbitMQConfig.AUDIT_EXCHANGE,
            RabbitMQConfig.AUDIT_ROUTING_KEY,
            log);
    }

    public List<AuditLog> getAll() {
        return auditRepository
            .findAllByOrderByTimestampDesc();
    }

    public List<AuditLog> getByUser(String username) {
        return auditRepository
            .findByPerformedByOrderByTimestampDesc(username);
    }
}
