-- =====================================================================
-- V3 — Multi-tenancy: organizations + memberships + org_id everywhere
-- =====================================================================
-- Introduces the tenant boundary the B2B product needs. Strategy for the
-- EXISTING production data:
--
--   every current user  ->  one "personal" organization of exactly one
--                           member, with that user as OWNER
--
-- so behaviour is byte-for-byte identical for everyone already on the
-- platform (an org of one sees exactly what that user saw before). Teams
-- only start to matter once a second member is invited.
--
-- owner_id is deliberately KEPT on every table alongside the new
-- organization_id. They mean different things and we need both:
--     owner_id        -> which user created this row (audit / "created by")
--     organization_id -> which tenant it belongs to (authorization)
-- Dropping owner_id would destroy authorship information and make this
-- migration irreversible.
--
-- Ordering note: columns are added nullable, backfilled, and only then
-- marked NOT NULL. SET NOT NULL takes a brief ACCESS EXCLUSIVE lock while
-- it scans the table; at current data volumes that is milliseconds. If
-- these tables ever grow to millions of rows, replace the SET NOT NULL
-- steps with "ADD CONSTRAINT ... CHECK (col IS NOT NULL) NOT VALID"
-- followed by "VALIDATE CONSTRAINT", which never blocks writes.
-- =====================================================================

SET LOCAL lock_timeout = '5s';


-- ---------------------------------------------------------------------
-- 1. Tenant tables
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
    id          VARCHAR(255) NOT NULL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    slug        VARCHAR(255) NOT NULL,
    personal    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP(6),
    updated_at  TIMESTAMP(6),
    CONSTRAINT uk_organizations_slug UNIQUE (slug)
);

CREATE TABLE IF NOT EXISTS memberships (
    id               VARCHAR(255) NOT NULL PRIMARY KEY,
    organization_id  VARCHAR(255) NOT NULL,
    user_id          BIGINT       NOT NULL,
    role             VARCHAR(255) NOT NULL,
    default_org      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP(6),
    CONSTRAINT uk_memberships_org_user UNIQUE (organization_id, user_id),
    CONSTRAINT fk_memberships_org  FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
    CONSTRAINT fk_memberships_user FOREIGN KEY (user_id)         REFERENCES users (id)         ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships (user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_org  ON memberships (organization_id);

-- An org must always have exactly one OWNER, otherwise nobody can administer
-- it. A partial unique index enforces "at most one"; application code
-- enforces "at least one" by refusing to demote or remove the last owner.
CREATE UNIQUE INDEX IF NOT EXISTS uk_memberships_single_owner
    ON memberships (organization_id) WHERE role = 'OWNER';

-- A user lands in exactly one org by default when they sign in.
CREATE UNIQUE INDEX IF NOT EXISTS uk_memberships_single_default
    ON memberships (user_id) WHERE default_org;


-- ---------------------------------------------------------------------
-- 2. Backfill: one personal organization per existing user
-- ---------------------------------------------------------------------
-- The slug is derived from the username but suffixed with the user id, so
-- it is unique even when two usernames normalise to the same string
-- (e.g. "a.b@x.com" and "a-b@x.com").
INSERT INTO organizations (id, name, slug, personal, created_at, updated_at)
SELECT
    gen_random_uuid()::text,
    u.username,
    lower(regexp_replace(u.username, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || u.id::text,
    TRUE,
    now(),
    now()
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM memberships m WHERE m.user_id = u.id
);

INSERT INTO memberships (id, organization_id, user_id, role, default_org, created_at)
SELECT
    gen_random_uuid()::text,
    o.id,
    u.id,
    'OWNER',
    TRUE,
    now()
FROM users u
JOIN organizations o
  ON o.slug = lower(regexp_replace(u.username, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || u.id::text
WHERE NOT EXISTS (
    SELECT 1 FROM memberships m WHERE m.user_id = u.id
);


-- ---------------------------------------------------------------------
-- 3. organization_id on every tenant-owned table
-- ---------------------------------------------------------------------
-- Added nullable so the ALTER is instant and existing rows stay valid.
ALTER TABLE businesses            ADD COLUMN IF NOT EXISTS organization_id VARCHAR(255);
ALTER TABLE campaigns             ADD COLUMN IF NOT EXISTS organization_id VARCHAR(255);
ALTER TABLE contacts              ADD COLUMN IF NOT EXISTS organization_id VARCHAR(255);
ALTER TABLE voice_calls           ADD COLUMN IF NOT EXISTS organization_id VARCHAR(255);
ALTER TABLE consultation_sessions ADD COLUMN IF NOT EXISTS organization_id VARCHAR(255);
ALTER TABLE invites               ADD COLUMN IF NOT EXISTS organization_id VARCHAR(255);
ALTER TABLE follow_ups            ADD COLUMN IF NOT EXISTS organization_id VARCHAR(255);
ALTER TABLE jobs                  ADD COLUMN IF NOT EXISTS organization_id VARCHAR(255);
ALTER TABLE roadmaps              ADD COLUMN IF NOT EXISTS organization_id VARCHAR(255);


-- ---------------------------------------------------------------------
-- 4. Backfill organization_id from each row's owner
-- ---------------------------------------------------------------------
UPDATE businesses t
   SET organization_id = m.organization_id
  FROM memberships m
 WHERE m.user_id = t.owner_id AND m.default_org AND t.organization_id IS NULL;

UPDATE campaigns t
   SET organization_id = m.organization_id
  FROM memberships m
 WHERE m.user_id = t.owner_id AND m.default_org AND t.organization_id IS NULL;

UPDATE contacts t
   SET organization_id = m.organization_id
  FROM memberships m
 WHERE m.user_id = t.owner_id AND m.default_org AND t.organization_id IS NULL;

UPDATE voice_calls t
   SET organization_id = m.organization_id
  FROM memberships m
 WHERE m.user_id = t.owner_id AND m.default_org AND t.organization_id IS NULL;

UPDATE consultation_sessions t
   SET organization_id = m.organization_id
  FROM memberships m
 WHERE m.user_id = t.owner_id AND m.default_org AND t.organization_id IS NULL;

UPDATE invites t
   SET organization_id = m.organization_id
  FROM memberships m
 WHERE m.user_id = t.owner_id AND m.default_org AND t.organization_id IS NULL;

UPDATE follow_ups t
   SET organization_id = m.organization_id
  FROM memberships m
 WHERE m.user_id = t.owner_id AND m.default_org AND t.organization_id IS NULL;

-- jobs.owner_id and roadmaps.user_id are themselves nullable (owner was added
-- to an already-populated table by the old ddl-auto=update). Rows with no
-- owner cannot be attributed to a tenant, so their organization_id stays NULL
-- and these two columns remain nullable — see step 5.
UPDATE jobs t
   SET organization_id = m.organization_id
  FROM memberships m
 WHERE m.user_id = t.owner_id AND m.default_org AND t.organization_id IS NULL;

UPDATE roadmaps t
   SET organization_id = m.organization_id
  FROM memberships m
 WHERE m.user_id = t.user_id AND m.default_org AND t.organization_id IS NULL;


-- ---------------------------------------------------------------------
-- 5. Enforce NOT NULL where the owner column was already NOT NULL
-- ---------------------------------------------------------------------
-- Safe because step 4 backfilled every row: owner_id is NOT NULL on these
-- seven tables, and every user got a default membership in step 2.
-- If any of these fail, the backfill above was incomplete — investigate
-- rather than weakening the constraint.
ALTER TABLE businesses            ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE campaigns             ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE contacts              ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE voice_calls           ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE consultation_sessions ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE invites               ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE follow_ups            ALTER COLUMN organization_id SET NOT NULL;

-- jobs / roadmaps intentionally left nullable to match their nullable owner.


-- ---------------------------------------------------------------------
-- 6. Foreign keys
-- ---------------------------------------------------------------------
-- NOT VALID skips the up-front full-table scan (instant, and still enforced
-- for all new and updated rows); VALIDATE then checks existing rows under a
-- lock that does NOT block reads or writes.
ALTER TABLE businesses            ADD CONSTRAINT fk_businesses_org  FOREIGN KEY (organization_id) REFERENCES organizations (id) NOT VALID;
ALTER TABLE campaigns             ADD CONSTRAINT fk_campaigns_org   FOREIGN KEY (organization_id) REFERENCES organizations (id) NOT VALID;
ALTER TABLE contacts              ADD CONSTRAINT fk_contacts_org    FOREIGN KEY (organization_id) REFERENCES organizations (id) NOT VALID;
ALTER TABLE voice_calls           ADD CONSTRAINT fk_voice_calls_org FOREIGN KEY (organization_id) REFERENCES organizations (id) NOT VALID;
ALTER TABLE consultation_sessions ADD CONSTRAINT fk_consult_org     FOREIGN KEY (organization_id) REFERENCES organizations (id) NOT VALID;
ALTER TABLE invites               ADD CONSTRAINT fk_invites_org     FOREIGN KEY (organization_id) REFERENCES organizations (id) NOT VALID;
ALTER TABLE follow_ups            ADD CONSTRAINT fk_follow_ups_org  FOREIGN KEY (organization_id) REFERENCES organizations (id) NOT VALID;
ALTER TABLE jobs                  ADD CONSTRAINT fk_jobs_org        FOREIGN KEY (organization_id) REFERENCES organizations (id) NOT VALID;
ALTER TABLE roadmaps              ADD CONSTRAINT fk_roadmaps_org    FOREIGN KEY (organization_id) REFERENCES organizations (id) NOT VALID;

ALTER TABLE businesses            VALIDATE CONSTRAINT fk_businesses_org;
ALTER TABLE campaigns             VALIDATE CONSTRAINT fk_campaigns_org;
ALTER TABLE contacts              VALIDATE CONSTRAINT fk_contacts_org;
ALTER TABLE voice_calls           VALIDATE CONSTRAINT fk_voice_calls_org;
ALTER TABLE consultation_sessions VALIDATE CONSTRAINT fk_consult_org;
ALTER TABLE invites               VALIDATE CONSTRAINT fk_invites_org;
ALTER TABLE follow_ups            VALIDATE CONSTRAINT fk_follow_ups_org;
ALTER TABLE jobs                  VALIDATE CONSTRAINT fk_jobs_org;
ALTER TABLE roadmaps              VALIDATE CONSTRAINT fk_roadmaps_org;


-- ---------------------------------------------------------------------
-- 7. Indexes — every tenant-scoped read filters on organization_id first
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_businesses_org_created  ON businesses            (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_org_created   ON campaigns             (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_org_created    ON contacts              (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_calls_org_created ON voice_calls           (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consult_org_created     ON consultation_sessions (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invites_org_created     ON invites               (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follow_ups_org_created  ON follow_ups            (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_org_created        ON jobs                  (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_roadmaps_org_created    ON roadmaps              (organization_id, created_at DESC);

-- Dedup probe during contact import is (org, phone), not (owner, phone).
CREATE INDEX IF NOT EXISTS idx_contacts_org_phone ON contacts (organization_id, phone);
