package com.genaibackend.aibackend.controller;

import com.genaibackend.aibackend.dto.BusinessProfileRequest;
import com.genaibackend.aibackend.dto.BusinessProfileResponse;
import com.genaibackend.aibackend.service.BusinessService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/businesses")
public class BusinessController {

    private final BusinessService businessService;

    public BusinessController(BusinessService businessService) {
        this.businessService = businessService;
    }

    @GetMapping("/me/profile")
    public ResponseEntity<BusinessProfileResponse> getMyBusinessProfile(Authentication authentication) {
        return businessService.getCurrentBusinessProfile(authentication.getName())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PutMapping("/me/profile")
    public ResponseEntity<BusinessProfileResponse> saveMyBusinessProfile(
            Authentication authentication,
            @RequestBody BusinessProfileRequest request
    ) {
        return ResponseEntity.ok(
                businessService.saveCurrentBusinessProfile(authentication.getName(), request)
        );
    }

    @PostMapping("/me/objection-playbook")
    public ResponseEntity<BusinessProfileResponse> generateObjectionPlaybook(Authentication authentication) {
        return ResponseEntity.ok(
                businessService.generateObjectionPlaybook(authentication.getName())
        );
    }
}
