package com.genaibackend.aibackend.controller;

import com.genaibackend.aibackend.dto.ConsultationResponse;
import com.genaibackend.aibackend.dto.InviteResolveResponse;
import com.genaibackend.aibackend.service.ConsultationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Public endpoints (no auth) hit by a customer who opened their invite link.
 * Resolves the token into per-business consultation config, and records the
 * resulting web voice call so its analysis can be extracted to the dashboard.
 */
@RestController
@RequestMapping("/api/invite")
public class PublicInviteController {

    private final ConsultationService consultationService;

    public PublicInviteController(ConsultationService consultationService) {
        this.consultationService = consultationService;
    }

    @GetMapping("/{token}")
    public ResponseEntity<InviteResolveResponse> resolve(@PathVariable String token) {
        return ResponseEntity.ok(consultationService.resolve(token));
    }

    @PostMapping("/{token}/consultation")
    public ResponseEntity<ConsultationResponse> recordConsultation(@PathVariable String token,
                                                                   @RequestBody Map<String, String> body) {
        String vapiCallId = body.get("vapiCallId");
        return ResponseEntity.ok(
                ConsultationResponse.from(consultationService.recordConsultation(token, vapiCallId)));
    }
}
