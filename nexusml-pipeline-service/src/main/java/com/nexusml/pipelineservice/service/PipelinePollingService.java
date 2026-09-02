package com.nexusml.pipelineservice.service;

import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.nexusml.pipelineservice.model.PipelineRun;
import com.nexusml.pipelineservice.repository.PipelineRunRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class PipelinePollingService {

    private final PipelineRunRepository repository;
    private final PipelineService pipelineService;

    @Scheduled(fixedDelayString = "${airflow.poll-interval-seconds:5}000")
    public void pollRunningPipelines() {
        List<PipelineRun> running = repository.findByStatus("running");
        if (running.isEmpty()) {
            return;
        }

        log.debug("Polling {} running pipelines", running.size());
        running.forEach(run -> {
            try {
                pipelineService.enrichWithTaskStatuses(run);
            } catch (Exception e) {
                log.error("Poll failed for {}: {}", run.getDagRunId(), e.getMessage());
            }
        });
    }
}
