package com.nexusml.modelservice.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.nexusml.modelservice.dto.MLflowModelVersionDTO;
import com.nexusml.modelservice.dto.MLflowRegisteredModelDTO;
import com.nexusml.modelservice.dto.ModelSignatureDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ModelService {

    private final MLflowClient mlflowClient;

    public List<MLflowRegisteredModelDTO> getAllRegisteredModels() {
        return mlflowClient.getRegisteredModels();
    }

    public List<MLflowModelVersionDTO> getModelVersions(String modelName) {
        return mlflowClient.getModelVersions(modelName);
    }

    public ModelSignatureDTO getModelSignature(String modelId) {
        return mlflowClient.getModelSignature(modelId);
    }
}
