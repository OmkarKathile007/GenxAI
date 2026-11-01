package com.genaibackend.aibackend.repository;

import com.genaibackend.aibackend.entity.ConsultationSession;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConsultationSessionRepository extends JpaRepository<ConsultationSession, String> {

    @EntityGraph(attributePaths = "contact")
    List<ConsultationSession> findByOrganizationIdOrderByCreatedAtDesc(String organizationId);

    // Tenant-scoped. Replaces an unscoped findByContactId... that returned
    // sessions for any contact id regardless of tenant.
    @EntityGraph(attributePaths = "contact")
    List<ConsultationSession> findByContactIdAndOrganizationIdOrderByCreatedAtDesc(String contactId, String organizationId);

    Optional<ConsultationSession> findByIdAndOrganizationId(String id, String organizationId);

    /** Resolved from the unauthenticated Vapi webhook; the call id is the capability. */
    Optional<ConsultationSession> findByVapiCallId(String vapiCallId);
}
