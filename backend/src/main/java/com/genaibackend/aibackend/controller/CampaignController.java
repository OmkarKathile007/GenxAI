package com.genaibackend.aibackend.controller;

import com.genaibackend.aibackend.dto.CampaignRequest;
import com.genaibackend.aibackend.dto.CampaignResponse;
import com.genaibackend.aibackend.service.CampaignService;
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
@RequestMapping("/api/campaigns")
public class CampaignController {

    private final CampaignService campaignService;

    public CampaignController(CampaignService campaignService) {
        this.campaignService = campaignService;
    }

    @GetMapping
    public ResponseEntity<List<CampaignResponse>> list(Authentication auth) {
        List<CampaignResponse> items = campaignService.list(auth.getName()).stream()
                .map(CampaignResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(items);
    }

    @PostMapping("/generate")
    public ResponseEntity<CampaignResponse> generate(Authentication auth, @RequestBody CampaignRequest req) {
        return ResponseEntity.ok(CampaignResponse.from(campaignService.generate(auth.getName(), req)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CampaignResponse> update(Authentication auth, @PathVariable String id,
                                                   @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(CampaignResponse.from(
                campaignService.updatePlan(auth.getName(), id, body.get("plan"))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable String id) {
        campaignService.delete(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
