package com.nexusml.identityservice.dto;

import java.time.LocalDateTime;

public record UserDTO(
    String id,
    String username,
    String email,
    String role,
    LocalDateTime createdAt,
    LocalDateTime lastLogin,
    boolean active
) {}
