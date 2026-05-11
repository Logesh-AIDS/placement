-- ============================================================================
-- Placement Portal - Auth Extension Schema
-- Run this AFTER schema.sql
-- ============================================================================

-- ============================================================================
-- USERS TABLE — add auth security columns
-- ============================================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_active        BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS failed_attempts  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until     TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS last_login_at    TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- ============================================================================
-- REFRESH TOKENS TABLE
-- Stores hashed refresh tokens for token rotation
-- ============================================================================

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,  -- SHA-256 hash of the token
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at  TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    ip_address  VARCHAR(45),                   -- IPv4 or IPv6
    user_agent  TEXT
);

CREATE INDEX idx_refresh_tokens_user_id   ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- ============================================================================
-- PASSWORD RESET TOKENS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at     TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_password_reset_user_id ON password_reset_tokens(user_id);

-- ============================================================================
-- CLEANUP FUNCTION — purge expired tokens (run via cron or pg_cron)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM refresh_tokens
    WHERE expires_at < CURRENT_TIMESTAMP OR revoked_at IS NOT NULL;

    DELETE FROM password_reset_tokens
    WHERE expires_at < CURRENT_TIMESTAMP OR used_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;
