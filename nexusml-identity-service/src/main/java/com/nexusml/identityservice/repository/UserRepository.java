package com.nexusml.identityservice.repository;

import com.nexusml.identityservice.model.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<AppUser, String> {
    Optional<AppUser> findByKeycloakId(String keycloakId);
    Optional<AppUser> findByUsername(String username);
}
