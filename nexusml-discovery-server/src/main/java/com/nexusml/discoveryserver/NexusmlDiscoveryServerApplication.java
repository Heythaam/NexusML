package com.nexusml.discoveryserver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

@EnableEurekaServer
@SpringBootApplication
public class NexusmlDiscoveryServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(NexusmlDiscoveryServerApplication.class, args);
    }

}
