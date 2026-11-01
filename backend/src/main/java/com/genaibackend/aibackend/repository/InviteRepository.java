package com.genaibackend.aibackend.repository;

import com.genaibackend.aibackend.entity.Invite;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InviteRepository extends JpaRepository<Invite, String> {

    // Fetch the contact eagerly so DTO mapping works with open-in-view disabled.
    @EntityGraph(attributePaths = "contact")
    List<Invite> findByOrganizationIdOrderByCreatedAtDesc(String organizationId);

    // Tenant-scoped. Replaces an unscoped findByContactId... that returned
    // invites for any contact id regardless of tenant.
    @EntityGraph(attributePaths = "contact")
    List<Invite> findByContactIdAndOrganizationIdOrderByCreatedAtDesc(String contactId, String organizationId);

    /**
     * Resolved from the PUBLIC invite link, which has no authenticated user and
     * therefore no tenant context — the unguessable token is itself the
     * capability. The tenant is then read off the returned row.
     */
    Optional<Invite> findByToken(String token);
}
