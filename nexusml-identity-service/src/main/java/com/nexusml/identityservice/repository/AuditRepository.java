package com.nexusml.identityservice.repository;

import com.nexusml.identityservice.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditRepository extends JpaRepository<AuditLog, String> {
    List<AuditLog> findAllByOrderByTimestampDesc();
    List<AuditLog> findByPerformedByOrderByTimestampDesc(String performedBy);
}
