package com.genaibackend.aibackend.tenant;

import com.genaibackend.aibackend.entity.Membership;
import com.genaibackend.aibackend.exception.TenantAccessDeniedException;
import com.genaibackend.aibackend.model.OrgRole;
import com.genaibackend.aibackend.repository.MembershipRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Resolves which organization the current HTTP request is acting on behalf of,
 * and proves the caller is a member of it.
 *
 * <p>This is the single choke point for tenancy. Services ask it for an org id
 * and pass that to org-scoped repository queries; no service should ever derive
 * a tenant from anything a client sent without going through here.
 *
 * <p><b>Selecting an org.</b> By default the caller's default organization is
 * used. A client may target a different one with the {@code X-Organization-Id}
 * header — which is verified against a Membership row every time. An id in a
 * header is a <i>request</i>, never a grant.
 *
 * <p><b>Request-scoped on purpose.</b> Membership is looked up once per request
 * and cached in this bean, so N service calls in one request cost one query
 * rather than N. It follows that this bean is unusable outside a request:
 * {@code @Async} / {@code @Scheduled} code (e.g. JobWorker) must read the tenant
 * off the entity it is processing instead of calling this.
 */
@Component
@RequestScope
public class TenantContext {

    private static final String ORG_HEADER = "X-Organization-Id";

    private final MembershipRepository membershipRepository;

    /** Resolved once per request; null until the first call. */
    private Membership resolved;

    public TenantContext(MembershipRepository membershipRepository) {
        this.membershipRepository = membershipRepository;
    }

    /**
     * The organization the current request acts on. Throws rather than
     * returning null — a tenant-scoped query with a missing tenant would read
     * across the whole table, so failing closed is the only safe option.
     */
    public String requireOrganizationId() {
        return resolve().getOrganization().getId();
    }

    /** The caller's role within the current organization. */
    public OrgRole requireRole() {
        return resolve().getRole();
    }

    /**
     * Enforces a minimum role. OWNER outranks ADMIN outranks MEMBER, so an
     * OWNER satisfies a requireRole(ADMIN) check.
     */
    public void requireAtLeast(OrgRole minimum) {
        OrgRole actual = requireRole();
        if (rank(actual) < rank(minimum)) {
            throw new TenantAccessDeniedException(
                    "This action requires the " + minimum + " role.");
        }
    }

    /** The authenticated username, for stamping authorship on new rows. */
    public String requireUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getName() == null) {
            throw new TenantAccessDeniedException("Not authenticated.");
        }
        return auth.getName();
    }

    private Membership resolve() {
        if (resolved != null) {
            return resolved;
        }

        String username = requireUsername();
        String requestedOrgId = requestedOrganizationId();

        Membership membership = (requestedOrgId == null || requestedOrgId.isBlank())
                ? membershipRepository.findByUserUsernameAndDefaultOrgTrue(username).orElse(null)
                : membershipRepository.findByUserUsernameAndOrganizationId(username, requestedOrgId).orElse(null);

        if (membership == null) {
            // Deliberately identical message whether the org does not exist or
            // the caller simply is not a member: distinguishing them would let
            // an attacker enumerate which organization ids are real.
            throw new TenantAccessDeniedException("No accessible organization for this request.");
        }

        this.resolved = membership;
        return membership;
    }

    private String requestedOrganizationId() {
        RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
        if (attrs instanceof ServletRequestAttributes servletAttrs) {
            return servletAttrs.getRequest().getHeader(ORG_HEADER);
        }
        return null;
    }

    private static int rank(OrgRole role) {
        return switch (role) {
            case OWNER -> 3;
            case ADMIN -> 2;
            case MEMBER -> 1;
        };
    }
}
