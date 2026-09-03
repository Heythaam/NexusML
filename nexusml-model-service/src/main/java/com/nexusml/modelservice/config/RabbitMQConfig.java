package com.nexusml.modelservice.config;

import org.springframework.amqp.core.AmqpTemplate;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String NEXUSML_EXCHANGE = "nexusml.exchange";
    public static final String MODEL_PROMOTED_KEY = "model.promoted";
    public static final String MODEL_REJECTED_KEY = "model.rejected";

    @Bean
    public TopicExchange nexusmlExchange() {
        return new TopicExchange(NEXUSML_EXCHANGE, true, false);
    }

    @Bean
    public Queue modelQueue() {
        return new Queue("model.events", true);
    }

    @Bean
    public Binding modelBinding(Queue modelQueue, TopicExchange nexusmlExchange) {
        return BindingBuilder
            .bind(modelQueue)
            .to(nexusmlExchange)
            .with("model.*");
    }

    // Named per-service (not just "integration.events") so this queue gets its
    // own fanned-out copy of every integration.updated event — a name shared
    // with pipeline-service's queue would make them competing consumers on
    // the same queue instead of each independently receiving every message.
    @Bean
    public Queue integrationEventsQueue() {
        return new Queue("integration.events.model-service", true);
    }

    @Bean
    public Binding integrationBinding(Queue integrationEventsQueue, TopicExchange nexusmlExchange) {
        return BindingBuilder
            .bind(integrationEventsQueue)
            .to(nexusmlExchange)
            .with("integration.*");
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

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory,
            MessageConverter jsonMessageConverter) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(jsonMessageConverter);
        return factory;
    }
}
