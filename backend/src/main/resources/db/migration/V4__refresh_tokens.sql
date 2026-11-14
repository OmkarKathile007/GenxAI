-- =====================================================================
-- V4 — Refresh tokens
-- =====================================================================
-- Keeps people signed in while the login token stays short-lived. Only a
-- SHA-256 hash is stored, so reading this table doesn't give anyone a usable
-- token.
--
-- Tokens rotate: each use retires the token and issues a new one in the same
-- family (one family per sign-in). If a retired token shows up again, someone
-- has a copy, so the whole family is revoked.
--   rotated_at  normal retirement, replaced by a newer token
--   revoked_at  the family was killed by logout or suspected theft
-- =====================================================================

SET LOCAL lock_timeout = '5s';

CREATE TABLE refresh_tokens (
    id          VARCHAR(255) NOT NULL PRIMARY KEY,
    user_id     BIGINT       NOT NULL,
    family_id   VARCHAR(255) NOT NULL,
    token_hash  VARCHAR(64)  NOT NULL,
    created_at  TIMESTAMP(6) NOT NULL,
    expires_at  TIMESTAMP(6) NOT NULL,
    rotated_at  TIMESTAMP(6),
    revoked_at  TIMESTAMP(6),
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uk_refresh_tokens_hash UNIQUE (token_hash)
);

CREATE INDEX idx_refresh_tokens_family ON refresh_tokens (family_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens (expires_at);
