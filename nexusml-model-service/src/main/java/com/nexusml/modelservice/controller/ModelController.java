package com.nexusml.modelservice.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import com.nexusml.modelservice.dto.MLflowModelVersionDTO;
import com.nexusml.modelservice.dto.MLflowRegisteredModelDTO;
import com.nexusml.modelservice.dto.ModelSignatureDTO;
import com.nexusml.modelservice.service.ModelService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class ModelController {

    private final ModelService modelService;

    @GetMapping("/registry")
    @PreAuthorize("hasAnyRole('ADMIN','DATA_SCIENTIST','VIEWER')")
    public ResponseEntity<List<MLflowRegisteredModelDTO>> getAllModels() {
        return ResponseEntity.ok(modelService.getAllRegisteredModels());
    }

    @GetMapping("/registry/{modelName}/versions")
    @PreAuthorize("hasAnyRole('ADMIN','DATA_SCIENTIST','VIEWER')")
    public ResponseEntity<List<MLflowModelVersionDTO>> getVersions(@PathVariable String modelName) {
        return ResponseEntity.ok(modelService.getModelVersions(modelName));
    }

    @GetMapping("/registry/{modelName}/signature/{modelId}")
    @PreAuthorize("hasAnyRole('ADMIN','DATA_SCIENTIST','VIEWER')")
    public ResponseEntity<ModelSignatureDTO> getSignature(
            @PathVariable String modelName,
            @PathVariable String modelId) {
        ModelSignatureDTO signature = modelService.getModelSignature(modelId);
        if (signature == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(signature);
    }
}
