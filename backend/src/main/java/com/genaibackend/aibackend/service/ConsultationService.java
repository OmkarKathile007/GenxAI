package com.genaibackend.aibackend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.genaibackend.aibackend.dto.InviteResolveResponse;
import com.genaibackend.aibackend.entity.Business;
import com.genaibackend.aibackend.entity.ConsultationSession;
import com.genaibackend.aibackend.entity.Contact;
import com.genaibackend.aibackend.entity.Invite;
import com.genaibackend.aibackend.repository.BusinessRepository;
import com.genaibackend.aibackend.repository.ConsultationSessionRepository;
import com.genaibackend.aibackend.repository.InviteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Powers the on-platform deep voice consultation reached via an invite link.
 * Resolves a token into per-business assistantOverrides (prompt, voice, and the
 * extraction schema), records the session, and pulls Vapi's analysis (the
 * customer's details + services) back into the dashboard.
 */
@Service
public class ConsultationService {

    private static final Logger log = LoggerFactory.getLogger(ConsultationService.class);

    @Value("${vapi.api.base-url}")
    private String baseUrl;

    @Value("${vapi.private.key}")
    private String privateKey;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final InviteRepository inviteRepository;
    private final BusinessRepository businessRepository;
    private final ConsultationSessionRepository consultationRepository;

    public ConsultationService(WebClient.Builder webClientBuilder,
                               ObjectMapper objectMapper,
                               InviteRepository inviteRepository,
                               BusinessRepository businessRepository,
                               ConsultationSessionRepository consultationRepository) {
        this.webClient = webClientBuilder.build();
        this.objectMapper = objectMapper;
        this.inviteRepository = inviteRepository;
        this.businessRepository = businessRepository;
        this.consultationRepository = consultationRepository;
    }

    @Transactional(readOnly = true)
    public InviteResolveResponse resolve(String token) {
        Invite invite = inviteRepository.findByToken(token).orElse(null);
        if (invite == null || invite.getContact() == null) {
            return InviteResolveResponse.invalid();
        }
        Contact contact = invite.getContact();
        Business business = businessRepository
                .findFirstByOwnerUsernameOrderByCreatedAtDesc(contact.getOwner().getUsername())
                .orElse(null);

        InviteResolveResponse r = new InviteResolveResponse();
        r.setValid(true);
        r.setUsed(invite.isAccepted());
        r.setContactName(contact.getFullName());
        r.setBusinessName(business != null ? business.getBusinessName() : "our team");
        r.setAgentName(business != null ? business.getAgentName() : null);
        r.setAssistantOverrides(buildConsultationOverrides(business, contact));
        return r;
    }

    @Transactional
    public ConsultationSession recordConsultation(String token, String vapiCallId) {
        Invite invite = inviteRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid invite"));
        Contact contact = invite.getContact();

        ConsultationSession session = consultationRepository.findByVapiCallId(vapiCallId).orElseGet(ConsultationSession::new);
        session.setOwner(contact.getOwner());
        session.setContact(contact);
        session.setInviteId(invite.getId());
        session.setVapiCallId(vapiCallId);
        if (session.getStatus() == null) session.setStatus("IN_PROGRESS");

        invite.setAccepted(true);
        inviteRepository.save(invite);

        session = consultationRepository.save(session);
        // Best-effort immediate pull (analysis may still be processing).
        try {
            syncFromVapi(session);
        } catch (Exception e) {
            log.warn("Initial consultation sync deferred: {}", e.getMessage());
        }
        return session;
    }

    @Transactional(readOnly = true)
    public List<ConsultationSession> listConsultations(String username) {
        return consultationRepository.findByOwnerUsernameOrderByCreatedAtDesc(username);
    }

    @Transactional
    public ConsultationSession syncByOwner(String username, String sessionId) {
        ConsultationSession session = consultationRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Consultation not found"));
        if (session.getOwner() == null || !username.equals(session.getOwner().getUsername())) {
            throw new RuntimeException("Consultation not found");
        }
        syncFromVapi(session);
        return session;
    }

    /** Pull transcript, summary, recording and extracted structuredData from Vapi. */
    private void syncFromVapi(ConsultationSession session) {
        if (session.getVapiCallId() == null || privateKey == null || privateKey.isBlank()) return;

        String raw = webClient.get()
                .uri(baseUrl + "/call/" + session.getVapiCallId())
                .header("Authorization", "Bearer " + privateKey)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        try {
            JsonNode root = objectMapper.readTree(raw);
            String status = root.path("status").asText("");
            if ("ended".equalsIgnoreCase(status)) {
                session.setStatus("ENDED");
                if (session.getEndedAt() == null) session.setEndedAt(LocalDateTime.now());
            }
            setIfText(root.path("transcript"), session::setTranscript);
            setIfText(root.path("recordingUrl"), session::setRecordingUrl);

            JsonNode analysis = root.path("analysis");
            setIfText(analysis.path("summary"), session::setSummary);
            JsonNode sd = analysis.path("structuredData");
            if (!sd.isMissingNode() && !sd.isNull()) {
                session.setStructuredData(objectMapper.writeValueAsString(sd));
            }
            consultationRepository.save(session);
        } catch (Exception e) {
            log.error("Failed to parse consultation call {}: {}", session.getVapiCallId(), e.getMessage());
        }
    }

    // ---- Per-business consultation prompt / voice / extraction schema ----

    private Map<String, Object> buildConsultationOverrides(Business business, Contact contact) {
        Map<String, Object> overrides = new HashMap<>();
        overrides.put("firstMessage", buildFirstMessage(business, contact));
        overrides.put("voice", resolveVoice(business == null ? null : business.getAgentVoice()));
        overrides.put("model", Map.of(
                "provider", "openai",
                "model", "gpt-4.1",
                "messages", new Object[]{
                        Map.of("role", "system", "content", buildPrompt(business, contact))
                }
        ));
        overrides.put("analysisPlan", Map.of("structuredDataPlan", Map.of(
                "enabled", true,
                "schema", consultationSchema()
        )));
        return overrides;
    }

    private Map<String, Object> consultationSchema() {
        Map<String, Object> props = new LinkedHashMap<>();
        props.put("fullName", strProp("The customer's full name"));
        props.put("email", strProp("The customer's email if mentioned"));
        props.put("servicesInterested", strProp("Which of the business's products/services the customer is interested in"));
        props.put("userNeed", strProp("What the customer is trying to achieve"));
        props.put("currentProblem", strProp("The main problem or pain point they described"));
        props.put("budgetRange", strProp("Budget or price expectations if mentioned"));
        props.put("decisionTimeline", strProp("How soon they want to proceed"));
        props.put("objections", strProp("Any concerns or objections raised"));
        props.put("recommendedOffer", strProp("The best-fit offer for this customer"));
        props.put("conversionProbability", Map.of("type", "number", "description", "0-100 likelihood of converting"));
        props.put("summary", strProp("A short summary of the consultation"));
        props.put("nextBestAction", strProp("Recommended next action for the sales team"));
        return Map.of("type", "object", "properties", props);
    }

    private Map<String, Object> strProp(String desc) {
        return Map.of("type", "string", "description", desc);
    }

    private String buildFirstMessage(Business business, Contact contact) {
        String first = firstName(contact.getFullName());
        String biz = business != null && notBlank(business.getBusinessName()) ? business.getBusinessName().trim() : "our team";
        String agent = (business != null && notBlank(business.getAgentName()))
                ? business.getAgentName().trim() : "your assistant";
        return "Hi " + first + ", welcome! This is " + agent + " from " + biz
                + ". Thanks for joining. I'd love to understand what you're looking for so we can help — is now a good time for a few quick questions?";
    }

    private String buildPrompt(Business business, Contact contact) {
        StringBuilder p = new StringBuilder();
        String biz = (business != null && notBlank(business.getBusinessName())) ? business.getBusinessName().trim() : "the business";
        if (business != null && notBlank(business.getAgentName())) {
            p.append("Your name is ").append(business.getAgentName().trim()).append(". ");
        }
        p.append("You are a warm, attentive AI consultant for ").append(biz)
                .append(". A customer named ").append(orDefault(contact.getFullName(), "the customer"))
                .append(" just joined the platform via their invite. Run a friendly, in-depth voice consultation.\n\n");

        if (business != null) {
            p.append("ABOUT THE BUSINESS (use only these facts):\n");
            appendField(p, "Products / services", business.getProductsServices());
            appendField(p, "Target customers", business.getTargetAudience());
            appendField(p, "Pricing notes", business.getPricingInfo());
            appendField(p, "Common questions and answers", business.getCommonFaqs());
            p.append("\n");
        }

        p.append("YOUR JOB:\n")
                .append("Understand the customer deeply and figure out which of our services fit them. Cover, one question at a time:\n")
                .append("- Their main goal and what they're looking for\n")
                .append("- The current problem or pain point\n")
                .append("- Which products/services interest them\n")
                .append("- Budget expectations\n")
                .append("- Decision timeline\n")
                .append("- Any concerns or objections\n")
                .append("Then recommend the best-fit offer and tell them a team member will follow up.\n\n");

        if (business != null && notBlank(business.getAgentGuardrails())) {
            p.append("IMPORTANT RULES:\n").append(business.getAgentGuardrails().trim()).append("\n\n");
        }

        p.append("STYLE:\n")
                .append("- Tone: ").append(orDefault(business == null ? null : business.getCallTone(), "warm, consultative, professional")).append(".\n")
                .append("- Language: ").append(orDefault(business == null ? null : business.getPreferredLanguage(), "English")).append(".\n")
                .append("- Conversational, short turns, one question at a time. Listen and acknowledge.\n")
                .append("- Never invent facts about pricing or services. Thank them warmly at the end.\n");
        return p.toString();
    }

    private Map<String, Object> resolveVoice(String agentVoice) {
        String choice = agentVoice == null ? "" : agentVoice.trim().toLowerCase();
        String voiceId;
        if (choice.contains("hindi") && choice.contains("male")) voiceId = "hi-IN-MadhurNeural";
        else if (choice.contains("hindi")) voiceId = "hi-IN-SwaraNeural";
        else if (choice.contains("male")) voiceId = "en-IN-PrabhatNeural";
        else voiceId = "en-IN-NeerjaNeural";
        return Map.of("provider", "azure", "voiceId", voiceId);
    }

    private void appendField(StringBuilder p, String label, String value) {
        if (notBlank(value)) p.append("- ").append(label).append(": ").append(value.trim()).append("\n");
    }

    private void setIfText(JsonNode node, java.util.function.Consumer<String> setter) {
        if (node != null && !node.isMissingNode() && !node.isNull()) {
            String s = node.asText();
            if (s != null && !s.isBlank()) setter.accept(s);
        }
    }

    private String firstName(String fullName) {
        if (fullName == null || fullName.isBlank()) return "there";
        return fullName.trim().split("\\s+")[0];
    }

    private String orDefault(String value, String fallback) {
        return notBlank(value) ? value.trim() : fallback;
    }

    private boolean notBlank(String s) { return s != null && !s.isBlank(); }
}
