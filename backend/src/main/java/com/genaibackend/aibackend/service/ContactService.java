package com.genaibackend.aibackend.service;

import com.genaibackend.aibackend.dto.ContactImportRequest;
import com.genaibackend.aibackend.dto.ContactRequest;
import com.genaibackend.aibackend.entity.Contact;
import com.genaibackend.aibackend.model.User;
import com.genaibackend.aibackend.repository.ContactRepository;
import com.genaibackend.aibackend.repository.OrganizationRepository;
import com.genaibackend.aibackend.repository.UserRepository;
import com.genaibackend.aibackend.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ContactService {

    private final ContactRepository contactRepository;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final TenantContext tenantContext;

    public ContactService(ContactRepository contactRepository,
                          UserRepository userRepository,
                          OrganizationRepository organizationRepository,
                          TenantContext tenantContext) {
        this.contactRepository = contactRepository;
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.tenantContext = tenantContext;
    }

    @Transactional(readOnly = true)
    public List<Contact> listContacts(String username) {
        return contactRepository.findByOrganizationIdOrderByCreatedAtDesc(
                tenantContext.requireOrganizationId());
    }

    /**
     * Tenant-scoped fetch. Returns the same "not found" for another tenant's
     * contact so ids cannot be probed for existence.
     */
    @Transactional(readOnly = true)
    public Contact getOwnedContact(String username, String contactId) {
        return contactRepository.findByIdAndOrganizationId(contactId, tenantContext.requireOrganizationId())
                .orElseThrow(() -> new RuntimeException("Contact not found"));
    }

    @Transactional
    public Contact createContact(String username, ContactRequest request) {
        User owner = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
        String orgId = tenantContext.requireOrganizationId();

        Contact contact = applyRequest(new Contact(), request);
        contact.setOrganization(organizationRepository.getReferenceById(orgId));
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
     *
     * <p>Duplicate detection is a single query for the whole batch. It used to
     * be one SELECT per row, so a 10,000-row import cost 10,000 round trips;
     * it now costs one, plus one batched insert.
     *
     * <p>It also de-duplicates rows against each other within the batch, which
     * the per-row version could not do: two identical phone numbers in the same
     * file both passed the "does it already exist" check and were both inserted.
     */
    @Transactional
    public ImportResult importContacts(String username, ContactImportRequest request) {
        User owner = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
        String orgId = tenantContext.requireOrganizationId();

        List<ContactRequest> rows = request.getContacts() == null ? List.of() : request.getContacts();

        // Normalise once; rows without a usable name/phone are skipped outright.
        List<ContactRequest> usable = new ArrayList<>();
        List<String> phones = new ArrayList<>();
        int skipped = 0;
        for (ContactRequest row : rows) {
            String name = trimToNull(row.getFullName());
            String phone = normalizePhone(row.getPhone());
            if (name == null || phone == null) {
                skipped++;
                continue;
            }
            usable.add(row);
            phones.add(phone);
        }

        // One query for every phone in the batch instead of one per row.
        Set<String> existingPhones = phones.isEmpty()
                ? Set.of()
                : contactRepository.findByOrganizationIdAndPhoneIn(orgId, phones).stream()
                        .map(Contact::getPhone)
                        .collect(Collectors.toSet());

        Set<String> seenInBatch = new HashSet<>();
        List<Contact> toSave = new ArrayList<>();
        int duplicates = 0;

        for (ContactRequest row : usable) {
            String phone = normalizePhone(row.getPhone());
            if (existingPhones.contains(phone) || !seenInBatch.add(phone)) {
                duplicates++;
                continue;
            }
            Contact contact = applyRequest(new Contact(), row);
            contact.setOrganization(organizationRepository.getReferenceById(orgId));
            contact.setOwner(owner);
            contact.setPhone(phone);
            if (contact.getSource() == null && request.getSource() != null) {
                contact.setSource(request.getSource());
            }
            toSave.add(contact);
        }

        contactRepository.saveAll(toSave);
        return new ImportResult(toSave.size(), skipped, duplicates);
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
