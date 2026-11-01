package com.genaibackend.aibackend.repository;

import com.genaibackend.aibackend.entity.Contact;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * All finders are scoped by organization_id. The previous owner-username-scoped
 * methods were deliberately removed rather than kept alongside these: leaving
 * both would make it easy to call the wrong one and leak across tenants.
 */
public interface ContactRepository extends JpaRepository<Contact, String> {

    List<Contact> findByOrganizationIdOrderByCreatedAtDesc(String organizationId);

    /** Tenant-scoped read-by-id. Returns empty for another tenant's contact. */
    Optional<Contact> findByIdAndOrganizationId(String id, String organizationId);

    /** Contacts are deduplicated per tenant, not per user. */
    Optional<Contact> findByOrganizationIdAndPhone(String organizationId, String phone);

    /**
     * Bulk dedup probe: one query for a whole import batch rather than one per
     * row, which is what the per-row lookup used to cost.
     */
    List<Contact> findByOrganizationIdAndPhoneIn(String organizationId, Collection<String> phones);

    long countByOrganizationId(String organizationId);

    long countByOrganizationIdAndStatus(String organizationId, String status);
}
