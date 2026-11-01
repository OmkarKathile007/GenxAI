-- =====================================================================
-- V2 — Indexes for hot query paths
-- =====================================================================
-- Postgres does NOT auto-index foreign keys, and Hibernate's ddl-auto only
-- created the two indexes declared via @Index. Every lookup below is
-- currently a sequential scan.
--
-- ---------------------------------------------------------------------
-- WHY NOT "CREATE INDEX CONCURRENTLY"?
-- ---------------------------------------------------------------------
-- Because it deadlocks against Flyway and hangs startup forever. This was
-- observed, not theorised: CREATE INDEX CONCURRENTLY waits for every
-- transaction that could see the table to finish first, and Flyway holds
-- its own second connection open ("idle in transaction") for the schema
-- history lock while the migration runs. The index build therefore waits
-- on Flyway, Flyway waits on the index build, and the application never
-- finishes booting (pg_stat_activity shows wait_event_type=Lock,
-- wait_event=virtualxid).
--
-- So these are plain, transactional CREATE INDEX statements. That takes a
-- SHARE lock on each table: concurrent reads continue, concurrent WRITES
-- block until the index is built. On tables of this size that is
-- milliseconds. lock_timeout below bounds the damage if it is ever not.
--
-- If a table here ever grows large enough that a blocking build is
-- unacceptable, do NOT add CONCURRENTLY to this file. Instead build that
-- index by hand, out of band, while the app is running:
--     CREATE INDEX CONCURRENTLY idx_foo ON foo (bar);
-- and then ship a migration containing only "CREATE INDEX IF NOT EXISTS"
-- so environments that already have it are a no-op.
-- =====================================================================

-- Fail fast rather than queueing behind a long-running transaction and
-- silently blocking writes for the duration. If this trips, the deploy
-- fails loudly and is retried — far better than a stalled table.
-- LOCAL: reverts automatically when this migration's transaction ends.
SET LOCAL lock_timeout = '5s';


-- Roles are @ElementCollection(fetch = EAGER): this table is hit on EVERY
-- authenticated request when CustomUserDetailsService loads the user.
-- Highest-value index in this file.
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id
    ON user_roles (user_id);


-- contacts — listContacts() orders by created_at desc within an owner;
-- importContacts() probes (owner, phone) once per imported row.
CREATE INDEX IF NOT EXISTS idx_contacts_owner_created
    ON contacts (owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contacts_owner_phone
    ON contacts (owner_id, phone);


-- jobs — the worker polls (status, created_at); the quota check counts
-- (owner_id, created_at) on every job submission.
CREATE INDEX IF NOT EXISTS idx_jobs_status_created
    ON jobs (status, created_at);

CREATE INDEX IF NOT EXISTS idx_jobs_owner_created
    ON jobs (owner_id, created_at);


-- Foreign keys used for per-owner listing and per-contact drill-down.
CREATE INDEX IF NOT EXISTS idx_voice_calls_owner
    ON voice_calls (owner_id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_contact
    ON voice_calls (contact_id);

CREATE INDEX IF NOT EXISTS idx_consult_owner
    ON consultation_sessions (owner_id);
CREATE INDEX IF NOT EXISTS idx_consult_contact
    ON consultation_sessions (contact_id);

CREATE INDEX IF NOT EXISTS idx_invites_owner
    ON invites (owner_id);
CREATE INDEX IF NOT EXISTS idx_invites_contact
    ON invites (contact_id);

CREATE INDEX IF NOT EXISTS idx_follow_ups_owner
    ON follow_ups (owner_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_contact
    ON follow_ups (contact_id);

CREATE INDEX IF NOT EXISTS idx_businesses_owner
    ON businesses (owner_id);

CREATE INDEX IF NOT EXISTS idx_campaigns_owner
    ON campaigns (owner_id);

CREATE INDEX IF NOT EXISTS idx_roadmaps_user
    ON roadmaps (user_id);


-- promptService.getActivePrompt(toolName) -> findByToolNameAndIsActiveTrue
CREATE INDEX IF NOT EXISTS idx_prompts_tool_active
    ON prompts (tool_name) WHERE is_active;
