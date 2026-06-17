package com.genaibackend.aibackend.service;

import com.genaibackend.aibackend.dto.ContactImportRequest;
import com.genaibackend.aibackend.dto.ContactRequest;
import com.genaibackend.aibackend.entity.Contact;
import com.genaibackend.aibackend.model.User;
import com.genaibackend.aibackend.repository.ContactRepository;
import com.genaibackend.aibackend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class ContactService {

    private final ContactRepository contactRepository;
    private final UserRepository userRepository;

    public ContactService(ContactRepository contactRepository, UserRepository userRepository) {
        this.contactRepository = contactRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<Contact> listContacts(String username) {
        return contactRepository.findByOwnerUsernameOrderByCreatedAtDesc(username);
    }

    @Transactional(readOnly = true)
    public Contact getOwnedContact(String username, String contactId) {
        return contactRepository.findByIdAndOwnerUsername(contactId, username)
                .orElseThrow(() -> new RuntimeException("Contact not found"));
    }

    @Transactional
    public Contact createContact(String username, ContactRequest request) {
        User owner = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
        Contact contact = applyRequest(new Contact(), request);
        contact.setOwner(owner);
        if (contact.getFullName() == null || contact.getFullName().isBlank()) {
            throw new RuntimeException("Contact name is required");
        }
        if (contact.getPhone() == null || contact.getPhone().isBlank()) {
            throw new RuntimeException("Contact phone is required");
        }
        return contactRepository.save(contact);
    }

    /**
     * Bulk-create contacts from a parsed CSV/Excel upload. Skips rows missing a
     * name or phone, and de-duplicates against existing contacts by phone.
     */
    @Transactional
    public ImportResult importContacts(String username, ContactImportRequest request) {
        User owner = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        int created = 0, skipped = 0, duplicates = 0;
        List<Contact> toSave = new ArrayList<>();

        for (ContactRequest row : request.getContacts()) {
            String name = trimToNull(row.getFullName());
            String phone = normalizePhone(row.getPhone());
            if (name == null || phone == null) {
                skipped++;
                continue;
            }
            if (contactRepository.findByOwnerUsernameAndPhone(username, phone).isPresent()) {
                duplicates++;
                continue;
            }
            Contact contact = applyRequest(new Contact(), row);
            contact.setOwner(owner);
            contact.setPhone(phone);
            if (contact.getSource() == null && request.getSource() != null) {
                contact.setSource(request.getSource());
            }
            toSave.add(contact);
            created++;
        }

        contactRepository.saveAll(toSave);
        return new ImportResult(created, skipped, duplicates);
    }

    @Transactional
    public void deleteContact(String username, String contactId) {
        Contact contact = getOwnedContact(username, contactId);
        contactRepository.delete(contact);
    }

    private Contact applyRequest(Contact contact, ContactRequest request) {
        contact.setFullName(trimToNull(request.getFullName()));
        contact.setPhone(normalizePhone(request.getPhone()));
        contact.setEmail(trimToNull(request.getEmail()));
        contact.setCompany(trimToNull(request.getCompany()));
        contact.setSource(trimToNull(request.getSource()));
        contact.setSegment(trimToNull(request.getSegment()));
        contact.setNotes(trimToNull(request.getNotes()));
        return contact;
    }

    /** Strip spaces/dashes/parens so numbers are dial-ready; keep a leading +. */
    private String normalizePhone(String raw) {
        if (raw == null) return null;
        String cleaned = raw.trim().replaceAll("[\\s()\\-.]", "");
        if (cleaned.isBlank()) return null;
        return cleaned;
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }

    /** Small summary returned to the client after an import. */
    public static class ImportResult {
        private final int created;
        private final int skipped;
        private final int duplicates;

        public ImportResult(int created, int skipped, int duplicates) {
            this.created = created;
            this.skipped = skipped;
            this.duplicates = duplicates;
        }

        public int getCreated() { return created; }
        public int getSkipped() { return skipped; }
        public int getDuplicates() { return duplicates; }
    }
}
