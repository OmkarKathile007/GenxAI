package com.genaibackend.aibackend.controller;

import com.genaibackend.aibackend.dto.FollowUpResponse;
import com.genaibackend.aibackend.dto.GenerateFollowUpRequest;
import com.genaibackend.aibackend.service.FollowUpService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/follow-ups")
public class FollowUpController {

    private final FollowUpService followUpService;

    public FollowUpController(FollowUpService followUpService) {
        this.followUpService = followUpService;
    }

    @GetMapping
    public ResponseEntity<List<FollowUpResponse>> list(Authentication auth) {
        List<FollowUpResponse> items = followUpService.list(auth.getName()).stream()
                .map(FollowUpResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(items);
    }

    @PostMapping("/generate")
    public ResponseEntity<FollowUpResponse> generate(Authentication auth, @RequestBody GenerateFollowUpRequest req) {
        return ResponseEntity.ok(FollowUpResponse.from(
                followUpService.generate(auth.getName(), req.getContactId(), req.getChannel())));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FollowUpResponse> update(Authentication auth, @PathVariable String id,
                                                   @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(FollowUpResponse.from(
                followUpService.updateMessage(auth.getName(), id, body.get("message"))));
    }

    @PostMapping("/{id}/improve")
    public ResponseEntity<FollowUpResponse> improve(Authentication auth, @PathVariable String id,
                                                    @RequestBody(required = false) Map<String, String> body) {
        String instruction = body != null ? body.get("instruction") : null;
        return ResponseEntity.ok(FollowUpResponse.from(
                followUpService.improve(auth.getName(), id, instruction)));
    }

    @PostMapping("/{id}/send")
    public ResponseEntity<FollowUpResponse> send(Authentication auth, @PathVariable String id,
                                                 @RequestBody(required = false) Map<String, String> body) {
        String channel = body != null ? body.get("channel") : null;
        return ResponseEntity.ok(FollowUpResponse.from(
                followUpService.send(auth.getName(), id, channel)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable String id) {
        followUpService.delete(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
