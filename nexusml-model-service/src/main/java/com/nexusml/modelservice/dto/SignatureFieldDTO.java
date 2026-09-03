package com.nexusml.modelservice.dto;

public record SignatureFieldDTO(
    String name,
    String type,
    boolean required,
    String tensorSpec
) {}
