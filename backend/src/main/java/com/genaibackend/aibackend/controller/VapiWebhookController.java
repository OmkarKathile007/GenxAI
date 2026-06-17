package com.genaibackend.aibackend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.genaibackend.aibackend.entity.Contact;
import com.genaibackend.aibackend.entity.VoiceCall;
import com.genaibackend.aibackend.repository.ContactRepository;
import com.genaibackend.aibackend.repository.VoiceCallRepository;
import com.genaibackend.aibackend.service.InviteService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Receives Vapi server events (configure this URL as the Server URL on your
 * Vapi assistant/number). Handles status-update and end-of-call-report to keep
 * {@link VoiceCall} rows in sync, and can auto-send the invite when a call ends.
 *
 * Public endpoint (no JWT) — Vapi calls it directly. Needs a publicly reachable
 * URL in production (e.g. an ngrok tunnel during local development).
 */
@RestController
@RequestMapping("/api/vapi")
public class VapiWebhookController {

    private static final Logger log = LoggerFactory.getLogger(VapiWebhookController.class);

    @Value("${app.invite.auto-send:false}")
    private boolean autoSendInvite;

    private final VoiceCallRepository voiceCallRepository;
    private final ContactRepository contactRepository;
    private final InviteService inviteService;

    public VapiWebhookController(VoiceCallRepository voiceCallRepository,
                                 ContactRepository contactRepository,
                                 InviteService inviteService) {
        this.voiceCallRepository = voiceCallRepository;
        this.contactRepository = contactRepository;
        this.inviteService = inviteService;
    }

    @PostMapping("/webhook")
    @Transactional
    public ResponseEntity<Map<String, Object>> handle(@RequestBody JsonNode body) {
        try {
            JsonNode message = body.path("message");
            String type = message.path("type").asText("");
            String callId = message.path("call").path("id").asText(null);
            if (callId == null) {
                callId = message.path("callId").asText(null);
            }

            if (callId == null) {
                log.warn("Vapi webhook '{}' without a call id — ignoring", type);
                return ResponseEntity.ok(Map.of("received", true));
            }

            VoiceCall call = voiceCallRepository.findByVapiCallId(callId).orElse(null);
            if (call == null) {
                log.warn("Vapi webhook for unknown call id {}", callId);
                return ResponseEntity.ok(Map.of("received", true));
            }

            switch (type) {
                case "status-update":
                    applyStatus(call, message.path("status").asText(null));
                    voiceCallRepository.save(call);
                    break;

                case "end-of-call-report":
                    call.setStatus("ENDED");
                    call.setEndedAt(LocalDateTime.now());
                    call.setEndedReason(text(message, "endedReason"));
                    String transcript = text(message, "transcript");
                    if (transcript != null) call.setTranscript(transcript);
                    String summary = text(message, "summary");
                    if (summary != null) call.setSummary(summary);
                    String recording = firstNonNull(
                            text(message, "recordingUrl"),
                            message.path("artifact").path("recordingUrl").asText(null));
                    if (recording != null) call.setRecordingUrl(recording);
                    voiceCallRepository.save(call);
                    onCallEnded(call);
                    break;

                default:
                    // transcript / speech / tool events — not persisted here
                    break;
            }

            return ResponseEntity.ok(Map.of("received", true));
        } catch (Exception e) {
            log.error("Vapi webhook processing error", e);
            // Always 200 so Vapi does not hammer retries on our parsing bugs.
            return ResponseEntity.ok(Map.of("received", true, "error", true));
        }
    }

    private void onCallEnded(VoiceCall call) {
        Contact contact = call.getContact();
        if (contact == null) return;

        if (!"INVITED".equals(contact.getStatus())) {
            contact.setStatus("CALLED");
            contactRepository.save(contact);
        }

        if (autoSendInvite) {
            try {
                inviteService.sendInviteToContact(contact, null);
            } catch (Exception e) {
                log.error("Auto-invite after call failed for contact {}: {}", contact.getId(), e.getMessage());
            }
        }
    }

    private void applyStatus(VoiceCall call, String vapiStatus) {
        if (vapiStatus == null) return;
        switch (vapiStatus) {
            case "queued":
            case "scheduled":
                call.setStatus("QUEUED");
                break;
            case "ringing":
                call.setStatus("RINGING");
                if (call.getStartedAt() == null) call.setStartedAt(LocalDateTime.now());
                break;
            case "in-progress":
                call.setStatus("IN_PROGRESS");
                break;
            case "ended":
                call.setStatus("ENDED");
                if (call.getEndedAt() == null) call.setEndedAt(LocalDateTime.now());
                break;
            default:
                break;
        }
    }

    private String text(JsonNode node, String field) {
        JsonNode v = node.path(field);
        return v.isMissingNode() || v.isNull() ? null : v.asText();
    }

    private String firstNonNull(String a, String b) {
        if (a != null && !a.isBlank()) return a;
        return (b != null && !b.isBlank()) ? b : null;
    }
}
