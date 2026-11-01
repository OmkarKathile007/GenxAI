package com.genaibackend.aibackend.repository;

import com.genaibackend.aibackend.entity.VoiceCall;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VoiceCallRepository extends JpaRepository<VoiceCall, String> {

    Optional<VoiceCall> findByIdAndOrganizationId(String id, String organizationId);

    // Fetch the contact eagerly so DTO mapping works with open-in-view disabled.
    @EntityGraph(attributePaths = "contact")
    List<VoiceCall> findByOrganizationIdOrderByCreatedAtDesc(String organizationId);

    // Always tenant-scoped. The old unscoped findByContactId... was removed: it
    // returned every call for a contact id regardless of who owned it, so any
    // caller that forgot to pre-check ownership leaked another tenant's calls.
    @EntityGraph(attributePaths = "contact")
    List<VoiceCall> findByContactIdAndOrganizationIdOrderByCreatedAtDesc(String contactId, String organizationId);

    /**
     * Looked up from the Vapi webhook, which is unauthenticated and therefore
     * has no tenant context — the vapiCallId itself is the capability. The
     * tenant is then read off the returned row, never supplied by the caller.
     */
    Optional<VoiceCall> findByVapiCallId(String vapiCallId);
}
