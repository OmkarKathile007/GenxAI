package com.genaibackend.aibackend.model;

/**
 * A user's role *within one organization*. Distinct from {@link Role}, which is
 * a platform-wide role (USER / ADMIN) and says nothing about what a user may do
 * inside a given tenant.
 *
 * A user can hold different roles in different organizations, which is why this
 * lives on {@link com.genaibackend.aibackend.entity.Membership} rather than on
 * User.
 */
public enum OrgRole {

    /**
     * Created the organization. Exactly one per org is guaranteed by
     * V3's partial unique index. Cannot be removed or demoted — doing so would
     * leave the org unadministerable.
     */
    OWNER,

    /** Can manage members and all org data, but cannot delete the org itself. */
    ADMIN,

    /** Can read and write org data; cannot manage members. */
    MEMBER
}
