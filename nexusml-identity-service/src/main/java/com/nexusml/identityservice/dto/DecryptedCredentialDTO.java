package com.nexusml.identityservice.dto;

public record DecryptedCredentialDTO(
    String id,
    String name,
    String type,
    String value
) {}
