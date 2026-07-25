package com.genaibackend.aibackend.listener;

import com.genaibackend.aibackend.config.RabbitMQConfig;
import com.genaibackend.aibackend.dto.EmailEvent;
import com.genaibackend.aibackend.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class EmailMessageListener {

    private static final Logger log = LoggerFactory.getLogger(EmailMessageListener.class);

    private final NotificationService notificationService;

    public EmailMessageListener(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @RabbitListener(queues = RabbitMQConfig.QUEUE_NAME)
    public void handleEmailEvent(EmailEvent event) {
        log.info("Received email event from RabbitMQ: {}", event);

        if ("WELCOME_EMAIL".equals(event.getType())) {
            notificationService.processWelcomeEmailEvent(event);
        } else {
            log.warn("Unknown email event type: {}", event.getType());
        }
    }
}
