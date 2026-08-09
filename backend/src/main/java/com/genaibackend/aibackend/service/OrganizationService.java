package com.genaibackend.aibackend.service;

import com.genaibackend.aibackend.entity.Membership;
import com.genaibackend.aibackend.entity.Organization;
import com.genaibackend.aibackend.model.OrgRole;
import com.genaibackend.aibackend.model.User;
import com.genaibackend.aibackend.repository.MembershipRepository;
import com.genaibackend.aibackend.repository.OrganizationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

/**
 * Creates and resolves tenants.
 *
 * <p>Every user must belong to at least one organization or they cannot use the
 * product at all — {@link com.genaibackend.aibackend.tenant.TenantContext}
 * fails closed. V3 backfilled a personal org for every user that existed at
 * migration time; this service covers everyone who signs up afterwards.
 */
@Service
public class OrganizationService {

    private static final Logger log = LoggerFactory.getLogger(OrganizationService.class);

    private final OrganizationRepository organizationRepository;
    private final MembershipRepository membershipRepository;

    public OrganizationService(OrganizationRepository organizationRepository,
                               MembershipRepository membershipRepository) {
        this.organizationRepository = organizationRepository;
        this.membershipRepository = membershipRepository;
    }

    /**
     * Gives a brand-new user their own single-member organization, mirroring
     * exactly what V3 did for pre-existing users.
     *
     * <p>Idempotent: if the user already has a default membership this is a
     * no-op, so it is safe to call from both the register and the Google-login
     * paths (a Google user can arrive at either).
     *
     * <p>Runs in the caller's transaction so that a user is never committed
     * without an organization — a user row with no membership is unusable and
     * would have to be repaired by hand.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public Organization provisionPersonalOrganization(User user) {
        return membershipRepository.findByUserUsernameAndDefaultOrgTrue(user.getUsername())
                .map(Membership::getOrganization)
                .orElseGet(() -> createPersonalOrganization(user));
    }

    private Organization createPersonalOrganization(User user) {
        Organization org = new Organization();
        org.setName(user.getUsername());
        org.setSlug(uniqueSlugFor(user));
        org.setPersonal(true);
        org = organizationRepository.save(org);

        Membership membership = new Membership();
        membership.setOrganization(org);
        membership.setUser(user);
        // The creator owns their own org. Enforced to one OWNER per org by the
        // partial unique index uk_memberships_single_owner.
        membership.setRole(OrgRole.OWNER);
        membership.setDefaultOrg(true);
        membershipRepository.save(membership);

        log.info("Provisioned personal organization {} for user {}", org.getId(), user.getUsername());
        return org;
    }

    /**
     * Mirrors the slug expression used by V3's backfill so that slugs are
     * generated the same way before and after the migration:
     * normalise the username, then suffix the user id to guarantee uniqueness
     * even when two usernames normalise identically.
     */
    private String uniqueSlugFor(User user) {
        String base = user.getUsername() == null ? "org" : user.getUsername();
        String normalised = base.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-");
        normalised = normalised.replaceAll("(^-+)|(-+$)", "");
        if (normalised.isBlank()) {
            normalised = "org";
        }
        return normalised + "-" + user.getId();
    }
}
