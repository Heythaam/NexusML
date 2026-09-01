package com.nexusml.identityservice.repository;

import com.nexusml.identityservice.model.EncryptedCredential;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CredentialRepository extends JpaRepository<EncryptedCredential, String> {
    List<EncryptedCredential> findByCreatedBy(String createdBy);
    Optional<EncryptedCredential> findByName(String name);
}
