package com.nexusml.identityservice.config;

import org.springframework.amqp.core.AmqpTemplate;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String AUDIT_QUEUE = "audit.events";
    public static final String AUDIT_EXCHANGE = "nexusml.exchange";
    public static final String AUDIT_ROUTING_KEY = "audit.log";
    public static final String INTEGRATION_UPDATED_KEY = "integration.updated";

    @Bean
    public Queue auditQueue() {
        return new Queue(AUDIT_QUEUE, true);
    }

    @Bean
    public TopicExchange auditExchange() {
        return new TopicExchange(AUDIT_EXCHANGE);
    }

    @Bean
    public Binding auditBinding(Queue auditQueue,
            TopicExchange auditExchange) {
        return BindingBuilder
            .bind(auditQueue)
            .to(auditExchange)
            .with(AUDIT_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public AmqpTemplate amqpTemplate(
            ConnectionFactory connectionFactory) {
        RabbitTemplate rabbitTemplate =
            new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(
            jsonMessageConverter());
        return rabbitTemplate;
    }
}
