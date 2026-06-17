package com.genaibackend.aibackend.controller;

import com.genaibackend.aibackend.dto.VoiceCallResponse;
import com.genaibackend.aibackend.service.VapiCallService;
import com.genaibackend.aibackend.repository.VoiceCallRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/calls")
public class CallController {

    private final VapiCallService vapiCallService;
    private final VoiceCallRepository voiceCallRepository;

    public CallController(VapiCallService vapiCallService, VoiceCallRepository voiceCallRepository) {
        this.vapiCallService = vapiCallService;
        this.voiceCallRepository = voiceCallRepository;
    }

    /** Tells the UI whether outbound calling is configured (so it can disable the button). */
    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> config() {
        return ResponseEntity.ok(Map.of("callingEnabled", vapiCallService.isConfigured()));
    }

    @PostMapping("/start/{contactId}")
    public ResponseEntity<VoiceCallResponse> startCall(Authentication auth, @PathVariable String contactId) {
        return ResponseEntity.ok(
                VoiceCallResponse.from(vapiCallService.startOutboundCall(auth.getName(), contactId)));
    }

    /** Pull the latest state (recording, transcript, qualified) from Vapi. */
    @PostMapping("/{id}/sync")
    public ResponseEntity<VoiceCallResponse> syncCall(Authentication auth, @PathVariable String id) {
        return ResponseEntity.ok(VoiceCallResponse.from(vapiCallService.syncCall(auth.getName(), id)));
    }

    @GetMapping
    public ResponseEntity<List<VoiceCallResponse>> listCalls(Authentication auth) {
        List<VoiceCallResponse> calls = voiceCallRepository
                .findByOwnerUsernameOrderByCreatedAtDesc(auth.getName()).stream()
                .map(VoiceCallResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(calls);
    }

    @GetMapping("/contact/{contactId}")
    public ResponseEntity<List<VoiceCallResponse>> listCallsForContact(@PathVariable String contactId) {
        List<VoiceCallResponse> calls = voiceCallRepository
                .findByContactIdOrderByCreatedAtDesc(contactId).stream()
                .map(VoiceCallResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(calls);
    }
}
