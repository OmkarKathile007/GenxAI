package com.genaibackend.aibackend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Sends SMS and WhatsApp messages through Twilio's REST API
 * ({@code POST /2010-04-01/Accounts/{sid}/Messages.json}). WhatsApp uses the
 * same endpoint with "whatsapp:" prefixed sender/recipient numbers.
 */
@Service
public class TwilioService {

    private static final Logger log = LoggerFactory.getLogger(TwilioService.class);
    private static final String API_BASE = "https://api.twilio.com/2010-04-01";

    @Value("${twilio.account.sid}")
    private String accountSid;

    @Value("${twilio.auth.token}")
    private String authToken;

    @Value("${twilio.sms.from}")
    private String smsFrom;

    @Value("${twilio.whatsapp.from}")
    private String whatsappFrom;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public TwilioService(WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        this.webClient = webClientBuilder.build();
        this.objectMapper = objectMapper;
    }

    public boolean isConfigured(String channel) {
        if (accountSid == null || accountSid.isBlank() || authToken == null || authToken.isBlank()) {
            return false;
        }
        return "WHATSAPP".equalsIgnoreCase(channel)
                ? notBlank(whatsappFrom)
                : notBlank(smsFrom);
    }

    /**
     * @return the Twilio message SID on success.
     */
    public String sendMessage(String channel, String toNumber, String body) {
        boolean isWhatsApp = "WHATSAPP".equalsIgnoreCase(channel);
        if (!isConfigured(channel)) {
            throw new IllegalStateException(
                    "Twilio is not configured for " + channel + ". Check the Twilio credentials and sender number.");
        }

        String from = isWhatsApp ? prefixWhatsApp(whatsappFrom) : smsFrom;
        String to = isWhatsApp ? prefixWhatsApp(toNumber) : toNumber;

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("To", to);
        form.add("From", from);
        form.add("Body", body);

        String basicAuth = Base64.getEncoder()
                .encodeToString((accountSid + ":" + authToken).getBytes(StandardCharsets.UTF_8));

        try {
            String raw = webClient.post()
                    .uri(API_BASE + "/Accounts/" + accountSid + "/Messages.json")
                    .header("Authorization", "Basic " + basicAuth)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(BodyInserters.fromFormData(form))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode root = objectMapper.readTree(raw);
            String sid = root.path("sid").asText(null);
            log.info("Twilio {} sent: sid={} to={}", channel, sid, toNumber);
            return sid;

        } catch (WebClientResponseException e) {
            String responseBody = e.getResponseBodyAsString();
            log.error("Twilio send failed ({}): {}", e.getStatusCode(), responseBody);
            String message = responseBody;
            try {
                message = objectMapper.readTree(responseBody).path("message").asText(responseBody);
            } catch (Exception ignored) {
                // keep raw body
            }
            throw new RuntimeException("Twilio error: " + message);
        } catch (Exception e) {
            log.error("Twilio send error", e);
            throw new RuntimeException("Failed to send message: " + e.getMessage());
        }
    }

    private String prefixWhatsApp(String number) {
        if (number == null) return null;
        return number.startsWith("whatsapp:") ? number : "whatsapp:" + number;
    }

    private boolean notBlank(String s) { return s != null && !s.isBlank(); }
}
