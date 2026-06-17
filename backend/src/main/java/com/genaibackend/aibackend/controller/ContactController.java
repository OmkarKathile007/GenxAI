package com.genaibackend.aibackend.controller;

import com.genaibackend.aibackend.dto.ContactImportRequest;
import com.genaibackend.aibackend.dto.ContactRequest;
import com.genaibackend.aibackend.dto.ContactResponse;
import com.genaibackend.aibackend.service.ContactService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/contacts")
public class ContactController {

    private final ContactService contactService;

    public ContactController(ContactService contactService) {
        this.contactService = contactService;
    }

    @GetMapping
    public ResponseEntity<List<ContactResponse>> listContacts(Authentication auth) {
        List<ContactResponse> contacts = contactService.listContacts(auth.getName()).stream()
                .map(ContactResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(contacts);
    }

    @PostMapping
    public ResponseEntity<ContactResponse> createContact(Authentication auth, @RequestBody ContactRequest request) {
        return ResponseEntity.ok(ContactResponse.from(contactService.createContact(auth.getName(), request)));
    }

    @PostMapping("/import")
    public ResponseEntity<Map<String, Object>> importContacts(Authentication auth,
                                                              @RequestBody ContactImportRequest request) {
        ContactService.ImportResult result = contactService.importContacts(auth.getName(), request);
        return ResponseEntity.ok(Map.of(
                "created", result.getCreated(),
                "skipped", result.getSkipped(),
                "duplicates", result.getDuplicates()
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteContact(Authentication auth, @PathVariable String id) {
        contactService.deleteContact(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
