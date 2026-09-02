package com.nexusml.pipelineservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class NexusmlPipelineServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(NexusmlPipelineServiceApplication.class, args);
    }

}
