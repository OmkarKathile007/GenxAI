package com.genaibackend.aibackend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.genaibackend.aibackend.entity.Business;
import com.genaibackend.aibackend.entity.Contact;
import com.genaibackend.aibackend.entity.VoiceCall;
import com.genaibackend.aibackend.repository.BusinessRepository;
import com.genaibackend.aibackend.repository.ContactRepository;
import com.genaibackend.aibackend.repository.InviteRepository;
import com.genaibackend.aibackend.repository.VoiceCallRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Places outbound phone calls through Vapi's REST API ({@code POST /call/phone})
 * using the server-side private key, the configured assistant, and a Vapi
 * phone number. Each attempt is persisted as a {@link VoiceCall}.
 */
@Service
public class VapiCallService {

    private static final Logger log = LoggerFactory.getLogger(VapiCallService.class);

    @Value("${vapi.api.base-url}")
    private String baseUrl;

    @Value("${vapi.private.key}")
    private String privateKey;

    @Value("${vapi.assistant.id}")
    private String assistantId;

    @Value("${vapi.phone.number.id}")
    private String phoneNumberId;

    @Value("${app.invite.auto-send:false}")
    private boolean autoSendInvite;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final ContactService contactService;
    private final ContactRepository contactRepository;
    private final VoiceCallRepository voiceCallRepository;
    private final InviteRepository inviteRepository;
    private final InviteService inviteService;
    private final BusinessRepository businessRepository;
    private final UsageService usageService;

    public VapiCallService(WebClient.Builder webClientBuilder,
                           ObjectMapper objectMapper,
                           ContactService contactService,
                           ContactRepository contactRepository,
                           VoiceCallRepository voiceCallRepository,
                           InviteRepository inviteRepository,
                           InviteService inviteService,
                           BusinessRepository businessRepository,
                           UsageService usageService) {
        this.webClient = webClientBuilder.build();
        this.objectMapper = objectMapper;
        this.contactService = contactService;
        this.contactRepository = contactRepository;
        this.voiceCallRepository = voiceCallRepository;
        this.inviteRepository = inviteRepository;
        this.inviteService = inviteService;
        this.businessRepository = businessRepository;
        this.usageService = usageService;
    }

    public boolean isConfigured() {
        return notBlank(privateKey) && notBlank(assistantId) && notBlank(phoneNumberId);
    }

    @Transactional
    public VoiceCall startOutboundCall(String username, String contactId) {
        Contact contact = contactService.getOwnedContact(username, contactId);

        if (!isConfigured()) {
            throw new IllegalStateException(
                    "Vapi outbound calling is not configured. Set VAPI_PRIVATE_KEY, VAPI_ASSISTANT_ID and VAPI_PHONE_NUMBER_ID.");
        }
        if (contact.getPhone() == null || contact.getPhone().isBlank()) {
            throw new IllegalStateException("Contact has no phone number to call.");
        }

        // Free-tier hard cap: reserve a call credit (throws 429 when exhausted).
        usageService.consumeVapiCall(username);

        VoiceCall call = new VoiceCall();
        call.setOwner(contact.getOwner());
        call.setContact(contact);
        call.setType("QUALIFY");
        call.setStatus("QUEUED");
        call = voiceCallRepository.save(call);

        Map<String, Object> payload = new HashMap<>();
        payload.put("assistantId", assistantId);
        payload.put("phoneNumberId", phoneNumberId);
        payload.put("customer", Map.of("number", contact.getPhone()));

        // Personalize the agent per-business and per-lead. The owner's Business
        // Profile (set during onboarding) becomes the agent's knowledge + goal,
        // and the contact's details personalize the greeting. Skipped if the
        // business hasn't onboarded yet (falls back to the base assistant).
        Business business = businessRepository
                .findFirstByOwnerUsernameOrderByCreatedAtDesc(contact.getOwner().getUsername())
                .orElse(null);
        Map<String, Object> overrides = buildAssistantOverrides(business, contact);
        // Free-tier per-call duration cap (e.g. 30s). Always applied when limits
        // are on, even if there is no business profile to personalize the agent.
        if (usageService.isEnabled()) {
            overrides.put("maxDurationSeconds", usageService.getMaxCallSeconds());
        }
        if (!overrides.isEmpty()) {
            payload.put("assistantOverrides", overrides);
        }

        try {
            String raw = webClient.post()
                    .uri(baseUrl + "/call/phone")
                    .header("Authorization", "Bearer " + privateKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode root = objectMapper.readTree(raw);
            String vapiCallId = root.path("id").asText(null);
            String vapiStatus = root.path("status").asText(null);

            call.setVapiCallId(vapiCallId);
            call.setStatus(mapStatus(vapiStatus, "RINGING"));
            call.setStartedAt(LocalDateTime.now());
            voiceCallRepository.save(call);

            contact.setStatus("CALLING");
            contact.setLastCalledAt(LocalDateTime.now());
            contactRepository.save(contact);

            log.info("Vapi outbound call started: callId={} contact={}", vapiCallId, contact.getId());
            return call;

        } catch (WebClientResponseException e) {
            String body = e.getResponseBodyAsString();
            log.error("Vapi call failed ({}): {}", e.getStatusCode(), body);
            call.setStatus("FAILED");
            call.setEndedReason(truncate(body, 480));
            voiceCallRepository.save(call);
            throw new RuntimeException("Vapi rejected the call: " + truncate(body, 240));
        } catch (Exception e) {
            log.error("Vapi call error", e);
            call.setStatus("FAILED");
            call.setEndedReason(truncate(e.getMessage(), 480));
            voiceCallRepository.save(call);
            throw new RuntimeException("Failed to place the call: " + e.getMessage());
        }
    }

    /**
     * Pull the latest state of a call from Vapi (GET /call/{id}) and update our
     * record: status, transcript, recording, summary, and the extracted
     * "qualified" flag. Works on localhost (outbound to Vapi) without a public
     * webhook. When the call has ended and the customer agreed, the platform
     * invite is sent automatically (if app.invite.auto-send is on).
     */
    @Transactional
    public VoiceCall syncCall(String username, String voiceCallId) {
        VoiceCall call = voiceCallRepository.findById(voiceCallId)
                .orElseThrow(() -> new RuntimeException("Call not found"));
        if (call.getOwner() == null || !username.equals(call.getOwner().getUsername())) {
            throw new RuntimeException("Call not found");
        }
        if (call.getVapiCallId() == null || call.getVapiCallId().isBlank()) {
            return call; // nothing placed on Vapi yet
        }
        if (!notBlank(privateKey)) {
            throw new IllegalStateException("Vapi is not configured.");
        }

        try {
            String raw = webClient.get()
                    .uri(baseUrl + "/call/" + call.getVapiCallId())
                    .header("Authorization", "Bearer " + privateKey)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode root = objectMapper.readTree(raw);
            call.setStatus(mapStatus(root.path("status").asText(null), call.getStatus()));
            setIfPresent(root, "transcript", call::setTranscript);
            setIfPresent(root, "recordingUrl", call::setRecordingUrl);
            if (call.getRecordingUrl() == null) {
                setIfPresent(root, "stereoRecordingUrl", call::setRecordingUrl);
            }
            setIfPresent(root, "endedReason", call::setEndedReason);

            JsonNode analysis = root.path("analysis");
            String summary = textOrNull(analysis.path("summary"));
            if (summary == null) summary = textOrNull(root.path("summary"));
            if (summary != null) call.setSummary(summary);

            Boolean qualified = extractQualified(analysis, root);
            if (qualified != null) call.setQualified(qualified);

            boolean ended = "ended".equalsIgnoreCase(root.path("status").asText(""))
                    || "ENDED".equals(call.getStatus());
            if (ended && call.getEndedAt() == null) {
                call.setEndedAt(LocalDateTime.now());
            }

            voiceCallRepository.save(call);

            if (ended) {
                maybeInviteOnAgreement(call);
            }
            return call;

        } catch (WebClientResponseException e) {
            log.error("Vapi sync failed ({}): {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Couldn't refresh the call from Vapi.");
        } catch (Exception e) {
            log.error("Vapi sync error", e);
            throw new RuntimeException("Couldn't refresh the call: " + e.getMessage());
        }
    }

    /** Move the contact forward and, if they agreed, auto-send the invite once. */
    private void maybeInviteOnAgreement(VoiceCall call) {
        Contact contact = call.getContact();
        if (contact == null) return;

        boolean agreed = Boolean.TRUE.equals(call.getQualified());
        boolean alreadyInvited = inviteRepository.findByContactIdOrderByCreatedAtDesc(contact.getId())
                .stream().anyMatch(i -> "SENT".equals(i.getStatus()));

        if (agreed && !alreadyInvited) {
            contact.setStatus("QUALIFIED");
            contactRepository.save(contact);
            if (autoSendInvite) {
                try {
                    inviteService.sendInviteToContact(contact, null);
                } catch (Exception e) {
                    log.error("Auto-invite failed for contact {}: {}", contact.getId(), e.getMessage());
                }
            }
        } else if (!"INVITED".equals(contact.getStatus())) {
            contact.setStatus("CALLED");
            contactRepository.save(contact);
        }
    }

    /** Read a boolean "qualified"/"consent" style flag from Vapi's analysis. */
    private Boolean extractQualified(JsonNode analysis, JsonNode root) {
        JsonNode sd = analysis.path("structuredData");
        for (String key : new String[]{"qualified", "consentForInvite", "inviteAccepted", "interested"}) {
            JsonNode v = sd.path(key);
            if (v.isBoolean()) return v.asBoolean();
            if (v.isTextual()) {
                String s = v.asText().trim().toLowerCase();
                if (s.equals("true") || s.equals("yes")) return true;
                if (s.equals("false") || s.equals("no")) return false;
            }
        }
        // Fall back to Vapi success evaluation (boolean-ish) if present.
        JsonNode success = analysis.path("successEvaluation");
        if (success.isBoolean()) return success.asBoolean();
        if (success.isTextual()) {
            String s = success.asText().trim().toLowerCase();
            if (s.equals("true") || s.equals("pass")) return true;
            if (s.equals("false") || s.equals("fail")) return false;
        }
        return null;
    }

    private void setIfPresent(JsonNode node, String field, java.util.function.Consumer<String> setter) {
        String v = textOrNull(node.path(field));
        if (v != null) setter.accept(v);
    }

    private String textOrNull(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) return null;
        String s = node.asText();
        return (s == null || s.isBlank()) ? null : s;
    }

    /**
     * Build per-call Vapi assistantOverrides from the business profile + lead:
     * a custom system prompt (the agent's knowledge, goal, qualification rules,
     * tone, language) and a personalized first message. Returns empty when there
     * is no business profile yet (use the base assistant as-is).
     */
    private Map<String, Object> buildAssistantOverrides(Business business, Contact contact) {
        Map<String, Object> overrides = new HashMap<>();
        if (business == null) return overrides;

        overrides.put("firstMessage", buildFirstMessage(business, contact));
        overrides.put("voice", resolveVoice(business.getAgentVoice()));
        overrides.put("model", Map.of(
                "provider", "openai",
                "model", "gpt-4.1",
                "messages", new Object[]{
                        Map.of("role", "system", "content", buildSystemPrompt(business, contact))
                }
        ));
        return overrides;
    }

    /** Map a friendly per-business voice choice to a Vapi voice. */
    private Map<String, Object> resolveVoice(String agentVoice) {
        return VoiceCatalog.resolve(agentVoice);
    }

    private String buildFirstMessage(Business business, Contact contact) {
        String first = firstName(contact.getFullName());
        String biz = orDefault(business.getBusinessName(), "our team");
        String agent = notBlank(business.getAgentName()) ? business.getAgentName().trim() + ", an AI assistant," : "an AI assistant";
        return "Hi " + first + ", this is " + agent + " calling on behalf of " + biz
                + ". Do you have a quick minute? I have just a couple of short questions.";
    }

    private String buildSystemPrompt(Business business, Contact contact) {
        StringBuilder p = new StringBuilder();
        String biz = orDefault(business.getBusinessName(), "the business");

        if (notBlank(business.getAgentName())) {
            p.append("Your name is ").append(business.getAgentName().trim()).append(". ");
        }
        p.append("You are a friendly, professional AI voice agent making an outbound call on behalf of ")
                .append(biz);
        if (notBlank(business.getIndustry())) p.append(", a ").append(business.getIndustry().trim()).append(" business");
        p.append(".\n\n");

        p.append("ABOUT THE BUSINESS (use only these facts — never invent details):\n");
        appendField(p, "What we offer", business.getProductsServices());
        appendField(p, "Target customers", business.getTargetAudience());
        appendField(p, "Pricing notes", business.getPricingInfo());
        appendField(p, "Common questions and answers", business.getCommonFaqs());
        p.append("\n");

        p.append("WHO YOU ARE CALLING:\n");
        appendField(p, "Name", contact.getFullName());
        appendField(p, "Company", contact.getCompany());
        appendField(p, "How they came to us", contact.getSource());
        p.append("\n");

        p.append("GOAL OF THIS CALL:\n");
        if (notBlank(business.getCallObjective())) {
            p.append(business.getCallObjective().trim()).append("\n");
        } else if (notBlank(business.getSalesGoal())) {
            p.append(business.getSalesGoal().trim()).append("\n");
        }
        p.append("1) Briefly introduce ").append(biz).append(". ")
                .append("2) Ask the qualification questions below (or 2-3 short discovery questions about need, urgency, and budget). ")
                .append("3) Handle objections politely using the facts above. ")
                .append("4) Judge whether they are a qualified, interested lead. ")
                .append("5) If they are interested, ASK clearly: \"Is it okay if I send you a link to continue with a quick consultation?\" ")
                .append("If they agree, that is consent for the invite.\n");

        if (notBlank(business.getQualificationQuestions())) {
            p.append("\nQUALIFICATION QUESTIONS (ask these, one at a time):\n")
                    .append(business.getQualificationQuestions().trim()).append("\n");
        }

        if (notBlank(business.getObjectionPlaybook())) {
            p.append("\nOBJECTION HANDLING (when the lead pushes back, respond in this spirit — adapt naturally, don't read verbatim):\n")
                    .append(business.getObjectionPlaybook().trim()).append("\n");
        }

        if (notBlank(business.getAgentGuardrails())) {
            p.append("\nIMPORTANT RULES (always follow):\n")
                    .append(business.getAgentGuardrails().trim()).append("\n");
        }
        p.append("\n");

        p.append("STYLE:\n")
                .append("- Tone: ").append(orDefault(business.getCallTone(), "warm, concise, and professional")).append(".\n")
                .append("- Language: ").append(orDefault(business.getPreferredLanguage(), "English")).append(".\n")
                .append("- Speak naturally in short turns. Ask one question at a time. Do not read long paragraphs.\n")
                .append("- Be honest; if you don't know something, say you'll follow up.\n")
                .append("- End the call politely once you've qualified them and asked about the invite.\n");

        return p.toString();
    }

    private void appendField(StringBuilder p, String label, String value) {
        if (notBlank(value)) p.append("- ").append(label).append(": ").append(value.trim()).append("\n");
    }

    private String firstName(String fullName) {
        if (fullName == null || fullName.isBlank()) return "there";
        return fullName.trim().split("\\s+")[0];
    }

    private String orDefault(String value, String fallback) {
        return notBlank(value) ? value.trim() : fallback;
    }

    private String mapStatus(String vapiStatus, String fallback) {
        if (vapiStatus == null) return fallback;
        switch (vapiStatus) {
            case "queued":
            case "scheduled":
                return "QUEUED";
            case "ringing":
                return "RINGING";
            case "in-progress":
                return "IN_PROGRESS";
            case "ended":
                return "ENDED";
            default:
                return fallback;
        }
    }

    private boolean notBlank(String s) { return s != null && !s.isBlank(); }

    private String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}
