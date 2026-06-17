package com.genaibackend.aibackend.service;

import com.genaibackend.aibackend.entity.Business;
import com.genaibackend.aibackend.entity.ConsultationSession;
import com.genaibackend.aibackend.entity.Contact;
import com.genaibackend.aibackend.entity.FollowUp;
import com.genaibackend.aibackend.entity.VoiceCall;
import com.genaibackend.aibackend.repository.BusinessRepository;
import com.genaibackend.aibackend.repository.ConsultationSessionRepository;
import com.genaibackend.aibackend.repository.FollowUpRepository;
import com.genaibackend.aibackend.repository.VoiceCallRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * The repurposed "Email Writer + objection handler": drafts a personalized
 * follow-up message for a contact using their call/consultation insights and
 * the business profile (via the existing Gemini engine), then sends it over
 * WhatsApp/SMS through Twilio.
 */
@Service
public class FollowUpService {

    private static final Logger log = LoggerFactory.getLogger(FollowUpService.class);

    private final AIService aiService;
    private final TwilioService twilioService;
    private final ContactService contactService;
    private final FollowUpRepository followUpRepository;
    private final VoiceCallRepository voiceCallRepository;
    private final ConsultationSessionRepository consultationRepository;
    private final BusinessRepository businessRepository;
    private final InviteService inviteService;

    public FollowUpService(AIService aiService,
                           TwilioService twilioService,
                           ContactService contactService,
                           FollowUpRepository followUpRepository,
                           VoiceCallRepository voiceCallRepository,
                           ConsultationSessionRepository consultationRepository,
                           BusinessRepository businessRepository,
                           InviteService inviteService) {
        this.aiService = aiService;
        this.twilioService = twilioService;
        this.contactService = contactService;
        this.followUpRepository = followUpRepository;
        this.voiceCallRepository = voiceCallRepository;
        this.consultationRepository = consultationRepository;
        this.businessRepository = businessRepository;
        this.inviteService = inviteService;
    }

    @Transactional(readOnly = true)
    public List<FollowUp> list(String username) {
        return followUpRepository.findByOwnerUsernameOrderByCreatedAtDesc(username);
    }

    @Transactional
    public FollowUp generate(String username, String contactId, String channelRaw) {
        Contact contact = contactService.getOwnedContact(username, contactId);
        String channel = normalizeChannel(channelRaw);

        Business business = businessRepository
                .findFirstByOwnerUsernameOrderByCreatedAtDesc(username).orElse(null);
        VoiceCall lastCall = first(voiceCallRepository.findByContactIdOrderByCreatedAtDesc(contactId));
        ConsultationSession lastConsult = first(consultationRepository.findByContactIdOrderByCreatedAtDesc(contactId));
        String inviteLink = inviteService.ensureInviteLink(contact);

        String prompt = buildPrompt(business, contact, lastCall, lastConsult, channel, inviteLink);
        String message = cleanup(aiService.generateText(prompt));

        FollowUp followUp = new FollowUp();
        followUp.setOwner(contact.getOwner());
        followUp.setContact(contact);
        followUp.setChannel(channel);
        followUp.setMessage(message);
        followUp.setStatus("DRAFT");
        return followUpRepository.save(followUp);
    }

    @Transactional
    public FollowUp updateMessage(String username, String id, String message) {
        FollowUp followUp = owned(username, id);
        followUp.setMessage(message);
        return followUpRepository.save(followUp);
    }

    /**
     * "Improve Text" tool, repurposed: tighten an existing draft — sharper tone,
     * phone-friendly length, and any objection handled better — without losing
     * the consultation link or inventing facts.
     */
    @Transactional
    public FollowUp improve(String username, String id, String instruction) {
        FollowUp followUp = owned(username, id);
        if (followUp.getMessage() == null || followUp.getMessage().isBlank()) {
            throw new RuntimeException("Nothing to improve — the draft is empty.");
        }
        boolean shortForm = !"EMAIL".equals(followUp.getChannel());

        StringBuilder p = new StringBuilder();
        p.append("You are a senior sales copywriter. Improve the ")
                .append(followUp.getChannel().toLowerCase())
                .append(" follow-up message below — make it clearer, warmer, and more persuasive.\n\n");
        p.append("RULES:\n");
        p.append("- Keep any URL/link exactly as-is (do not alter, shorten, or remove it).\n");
        p.append("- Do not invent prices, discounts, names, or facts not already in the message.\n");
        p.append("- Keep one clear call to action.\n");
        if (shortForm) {
            p.append("- Keep it under 55 words and easy to read on a phone. No subject line.\n");
        } else {
            p.append("- Keep it under 120 words.\n");
        }
        if (notBlank(instruction)) {
            p.append("- Extra instruction from the user: ").append(instruction.trim()).append("\n");
        }
        p.append("\nMESSAGE TO IMPROVE:\n").append(followUp.getMessage().trim());
        p.append("\n\nReturn ONLY the improved message text, with no preamble, quotes, or explanation.");

        String improved = cleanup(aiService.generateText(p.toString()));
        if (notBlank(improved)) {
            followUp.setMessage(improved);
            return followUpRepository.save(followUp);
        }
        return followUp;
    }

    @Transactional
    public FollowUp send(String username, String id, String channelOverride) {
        FollowUp followUp = owned(username, id);
        String channel = channelOverride != null && !channelOverride.isBlank()
                ? normalizeChannel(channelOverride) : followUp.getChannel();
        followUp.setChannel(channel);

        if ("EMAIL".equals(channel)) {
            throw new RuntimeException("Email sending isn't enabled yet — copy the message or use WhatsApp/SMS.");
        }
        try {
            String sid = twilioService.sendMessage(channel, followUp.getContact().getPhone(), followUp.getMessage());
            followUp.setStatus("SENT");
            followUp.setProviderMessageId(sid);
            followUp.setSentAt(LocalDateTime.now());
        } catch (Exception e) {
            log.error("Follow-up send failed for {}: {}", id, e.getMessage());
            followUp.setStatus("FAILED");
            followUp.setErrorMessage(truncate(e.getMessage(), 480));
        }
        return followUpRepository.save(followUp);
    }

    @Transactional
    public void delete(String username, String id) {
        followUpRepository.delete(owned(username, id));
    }

    // ---- helpers ----

    private String buildPrompt(Business business, Contact contact, VoiceCall call,
                               ConsultationSession consult, String channel, String inviteLink) {
        String biz = business != null && notBlank(business.getBusinessName()) ? business.getBusinessName().trim() : "our team";
        String agent = business != null && notBlank(business.getAgentName()) ? business.getAgentName().trim() : "the team";
        boolean shortForm = !"EMAIL".equals(channel);

        StringBuilder p = new StringBuilder();
        p.append("You are a sales follow-up copywriter for ").append(biz).append(".\n");
        p.append("Write a ").append(channel.toLowerCase()).append(" follow-up message to ")
                .append(orDefault(contact.getFullName(), "the customer")).append(" after our AI voice outreach.\n\n");

        p.append("CONTEXT:\n");
        if (business != null) {
            appendLine(p, "Business offers", business.getProductsServices());
            appendLine(p, "Pricing notes", business.getPricingInfo());
        }
        appendLine(p, "Lead source", contact.getSource());
        if (call != null) {
            appendLine(p, "Call summary", call.getSummary());
            if (Boolean.TRUE.equals(call.getQualified())) p.append("- The lead was qualified / interested.\n");
        }
        if (consult != null) {
            appendLine(p, "Consultation summary", consult.getSummary());
            appendLine(p, "Extracted details (JSON)", consult.getStructuredData());
        }

        p.append("\nRULES:\n");
        if (business != null && notBlank(business.getAgentGuardrails())) {
            p.append("- Honor these business rules: ").append(business.getAgentGuardrails().trim()).append("\n");
        }
        p.append("- Sign off as ").append(agent).append(" from ").append(biz).append(".\n");
        p.append("- Tone: ").append(orDefault(business == null ? null : business.getCallTone(), "warm and professional")).append(".\n");
        p.append("- Address any objection raised, briefly and positively.\n");
        if (notBlank(inviteLink)) {
            p.append("- The clear next step is to continue the consultation at this exact link (include it verbatim, do not alter it): ")
                    .append(inviteLink).append("\n");
        } else {
            p.append("- Include ONE clear next step (e.g., book a consultation, reply YES).\n");
        }
        if (shortForm) {
            p.append("- Keep it under 55 words, friendly and easy to read on a phone. No subject line.\n");
        } else {
            p.append("- Keep it concise (under 120 words). You may include a short subject line on the first line.\n");
        }
        p.append("- Do not invent prices, discounts, or facts not given above.\n");
        p.append("\nReturn ONLY the message text, with no preamble, quotes, or explanation.");
        return p.toString();
    }

    private String normalizeChannel(String raw) {
        String c = raw == null ? "" : raw.trim().toUpperCase();
        if ("SMS".equals(c)) return "SMS";
        if ("EMAIL".equals(c)) return "EMAIL";
        return "WHATSAPP";
    }

    private FollowUp owned(String username, String id) {
        FollowUp f = followUpRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Follow-up not found"));
        if (f.getOwner() == null || !username.equals(f.getOwner().getUsername())) {
            throw new RuntimeException("Follow-up not found");
        }
        return f;
    }

    private <T> T first(List<T> list) {
        return (list == null || list.isEmpty()) ? null : list.get(0);
    }

    private void appendLine(StringBuilder p, String label, String value) {
        if (notBlank(value)) p.append("- ").append(label).append(": ").append(value.trim()).append("\n");
    }

    /** Strip wrapping quotes / stray markdown the model sometimes adds. */
    private String cleanup(String s) {
        if (s == null) return "";
        String t = s.trim();
        if (t.length() >= 2 && ((t.startsWith("\"") && t.endsWith("\"")) || (t.startsWith("'") && t.endsWith("'")))) {
            t = t.substring(1, t.length() - 1).trim();
        }
        return t;
    }

    private String orDefault(String value, String fallback) {
        return notBlank(value) ? value.trim() : fallback;
    }

    private boolean notBlank(String s) { return s != null && !s.isBlank(); }

    private String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}
