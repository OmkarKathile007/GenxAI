package com.genaibackend.aibackend.controller;

import com.genaibackend.aibackend.dto.ConsultationResponse;
import com.genaibackend.aibackend.service.ConsultationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/consultations")
public class ConsultationController {

    private final ConsultationService consultationService;

    public ConsultationController(ConsultationService consultationService) {
        this.consultationService = consultationService;
    }

    @GetMapping
    public ResponseEntity<List<ConsultationResponse>> list(Authentication auth) {
        List<ConsultationResponse> sessions = consultationService.listConsultations(auth.getName()).stream()
                .map(ConsultationResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(sessions);
    }

    /** Re-pull the latest analysis (details + services) from Vapi. */
    @PostMapping("/{id}/sync")
    public ResponseEntity<ConsultationResponse> sync(Authentication auth, @PathVariable String id) {
        return ResponseEntity.ok(
                ConsultationResponse.from(consultationService.syncByOwner(auth.getName(), id)));
    }
}
