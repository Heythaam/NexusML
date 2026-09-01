package com.nexusml.identityservice.service;

import com.nexusml.identityservice.model.AppUser;
import com.nexusml.identityservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final AuditService auditService;

    public AppUser syncFromKeycloak(String keycloakId,
            String username, String email, String role) {
        return userRepository
            .findByKeycloakId(keycloakId)
            .map(user -> {
                user.setLastLogin(LocalDateTime.now());
                return userRepository.save(user);
            })
            .orElseGet(() -> {
                AppUser newUser = AppUser.builder()
                    .keycloakId(keycloakId)
                    .username(username)
                    .email(email)
                    .role(role)
                    .createdAt(LocalDateTime.now())
                    .lastLogin(LocalDateTime.now())
                    .active(true)
                    .build();
                AppUser saved = userRepository.save(newUser);
                auditService.log(
                    "USER_CREATED", username,
                    "USER", saved.getId(),
                    "New user synced from Keycloak", "SUCCESS");
                return saved;
            });
    }

    public List<AppUser> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<AppUser> getByUsername(String username) {
        return userRepository.findByUsername(username);
    }
}
