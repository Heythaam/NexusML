package com.nexusml.identityservice.service;

import com.nexusml.identityservice.dto.CreateCredentialRequest;
import com.nexusml.identityservice.dto.CredentialDTO;
import com.nexusml.identityservice.dto.DecryptedCredentialDTO;
import com.nexusml.identityservice.model.EncryptedCredential;
import com.nexusml.identityservice.repository.CredentialRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CredentialService {

    private final CredentialRepository credentialRepository;
    private final EncryptionService encryptionService;
    private final AuditService auditService;

    public List<CredentialDTO> getAllCredentials() {
        return credentialRepository.findAll()
            .stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public CredentialDTO createCredential(
            CreateCredentialRequest request, String createdBy) {
        if (request.value() == null || request.value().isBlank()) {
            throw new IllegalArgumentException(
                "Credential value is required");
        }
        try {
            String encrypted = encryptionService
                .encrypt(request.value());
            EncryptedCredential credential =
                EncryptedCredential.builder()
                    .name(request.name())
                    .type(request.type())
                    .description(request.description())
                    .category(request.category())
                    .encryptedValue(encrypted)
                    .createdBy(createdBy)
                    .createdAt(LocalDateTime.now())
                    .build();
            EncryptedCredential saved =
                credentialRepository.save(credential);
            auditService.log(
                "CREDENTIAL_CREATED", createdBy,
                "CREDENTIAL", saved.getId(),
                "Created credential: " + request.name(),
                "SUCCESS");
            return toDTO(saved);
        } catch (Exception e) {
            throw new RuntimeException(
                "Failed to encrypt credential", e);
        }
    }

    public CredentialDTO updateCredential(String id,
            CreateCredentialRequest request, String updatedBy) {
        EncryptedCredential credential = credentialRepository
            .findById(id)
            .orElseThrow(() -> new EntityNotFoundException(
                "Credential not found"));
        try {
            credential.setName(request.name());
            credential.setType(request.type());
            credential.setDescription(request.description());
            credential.setCategory(request.category());
            if (request.value() != null && !request.value().isBlank()) {
                credential.setEncryptedValue(
                    encryptionService.encrypt(request.value()));
            }
            credential.setUpdatedAt(LocalDateTime.now());
            EncryptedCredential saved =
                credentialRepository.save(credential);
            auditService.log(
                "CREDENTIAL_UPDATED", updatedBy,
                "CREDENTIAL", id,
                "Updated credential: " + request.name(),
                "SUCCESS");
            return toDTO(saved);
        } catch (Exception e) {
            throw new RuntimeException(
                "Failed to update credential", e);
        }
    }

    public void deleteCredential(String id, String deletedBy) {
        EncryptedCredential credential = credentialRepository
            .findById(id)
            .orElseThrow(() -> new EntityNotFoundException(
                "Credential not found"));
        credentialRepository.delete(credential);
        auditService.log(
            "CREDENTIAL_DELETED", deletedBy,
            "CREDENTIAL", id,
            "Deleted credential: " + credential.getName(),
            "SUCCESS");
    }

    public DecryptedCredentialDTO getDecrypted(
            String id, String requestedBy) {
        EncryptedCredential credential = credentialRepository
            .findById(id)
            .orElseThrow(() -> new EntityNotFoundException(
                "Credential not found"));
        try {
            String decrypted = encryptionService
                .decrypt(credential.getEncryptedValue());
            auditService.log(
                "CREDENTIAL_ACCESSED", requestedBy,
                "CREDENTIAL", id,
                "Accessed credential: " + credential.getName(),
                "SUCCESS");
            return new DecryptedCredentialDTO(
                credential.getId(),
                credential.getName(),
                credential.getType(),
                decrypted);
        } catch (Exception e) {
            throw new RuntimeException(
                "Failed to decrypt credential", e);
        }
    }

    private CredentialDTO toDTO(EncryptedCredential c) {
        return new CredentialDTO(
            c.getId(),
            c.getName(),
            c.getType(),
            c.getDescription(),
            c.getCategory(),
            c.getCreatedBy(),
            c.getCreatedAt(),
            c.getUpdatedAt());
    }
}
