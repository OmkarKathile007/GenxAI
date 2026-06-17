package com.genaibackend.aibackend.controller;

import com.genaibackend.aibackend.dto.InviteResponse;
import com.genaibackend.aibackend.dto.SendInviteRequest;
import com.genaibackend.aibackend.service.InviteService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/invites")
public class InviteController {

    private final InviteService inviteService;

    public InviteController(InviteService inviteService) {
        this.inviteService = inviteService;
    }

    @PostMapping("/send/{contactId}")
    public ResponseEntity<InviteResponse> sendInvite(Authentication auth,
                                                     @PathVariable String contactId,
                                                     @RequestBody(required = false) SendInviteRequest request) {
        String channel = request != null ? request.getChannel() : null;
        return ResponseEntity.ok(InviteResponse.from(inviteService.sendInvite(auth.getName(), contactId, channel)));
    }

    @GetMapping
    public ResponseEntity<List<InviteResponse>> listInvites(Authentication auth) {
        List<InviteResponse> invites = inviteService.listInvites(auth.getName()).stream()
                .map(InviteResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(invites);
    }
}
