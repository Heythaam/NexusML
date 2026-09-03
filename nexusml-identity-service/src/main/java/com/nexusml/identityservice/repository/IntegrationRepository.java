package com.nexusml.identityservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.nexusml.identityservice.model.IntegrationConfig;

public interface IntegrationRepository extends JpaRepository<IntegrationConfig, String> {}
