package com.nexusml.modelservice.dto;

import java.util.List;

public record ModelSignatureDTO(
    List<SignatureFieldDTO> inputs,
    List<SignatureFieldDTO> outputs,
    String flavor,
    String frameworkVersion,
    String mlflowVersion,
    String modelId
) {}
