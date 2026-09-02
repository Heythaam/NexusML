package com.nexusml.pipelineservice.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.nexusml.pipelineservice.model.PipelineRun;

public interface PipelineRunRepository extends JpaRepository<PipelineRun, String> {
    List<PipelineRun> findByStatus(String status);
    List<PipelineRun> findAllByOrderByTriggeredAtDesc();
    List<PipelineRun> findByTriggeredBy(String triggeredBy);
}
