package com.nexusml.pipelineservice.config;

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

    public static final String NEXUSML_EXCHANGE = "nexusml.exchange";
    public static final String PIPELINE_TRIGGERED_KEY = "pipeline.triggered";
    public static final String PIPELINE_COMPLETED_KEY = "pipeline.completed";

    @Bean
    public TopicExchange nexusmlExchange() {
        return new TopicExchange(NEXUSML_EXCHANGE, true, false);
    }

    @Bean
    public Queue pipelineQueue() {
        return new Queue("pipeline.events", true);
    }

    @Bean
    public Binding pipelineBinding(Queue pipelineQueue, TopicExchange nexusmlExchange) {
        return BindingBuilder
            .bind(pipelineQueue)
            .to(nexusmlExchange)
            .with("pipeline.*");
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public AmqpTemplate amqpTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}
