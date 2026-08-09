package com.genaibackend.aibackend.repository;

import com.genaibackend.aibackend.entity.Membership;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MembershipRepository extends JpaRepository<Membership, String> {

    /**
     * The org a user lands in when they sign in without naming one. Guaranteed
     * to be at most one row by the partial unique index uk_memberships_single_default.
     */
    @EntityGraph(attributePaths = "organization")
    Optional<Membership> findByUserUsernameAndDefaultOrgTrue(String username);

    /**
     * Authorization probe: does this user belong to this org at all? Every
     * tenant-scoped request resolves through here, so it must stay indexed
     * (idx_memberships_user + uk_memberships_org_user).
     */
    Optional<Membership> findByUserUsernameAndOrganizationId(String username, String organizationId);

    @EntityGraph(attributePaths = "organization")
    List<Membership> findByUserUsername(String username);

    @EntityGraph(attributePaths = "user")
    List<Membership> findByOrganizationId(String organizationId);

    long countByOrganizationId(String organizationId);
}
