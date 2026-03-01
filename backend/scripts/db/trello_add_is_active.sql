-- =============================================================================
-- Migration: Add is_active column to trello users table
-- Database:  trello_db  (see TRELLO_DB_NAME in .env.prod)
-- Run once:  psql -U <user> -d <trello_db_name> -f trello_add_is_active.sql
-- =============================================================================

-- Add is_active column if it does not already exist (idempotent)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT false;

-- =============================================================================
-- ADMIN COMMANDS (run manually as needed, do NOT include in automated deploys)
-- =============================================================================

-- Activate a specific user by email:
-- UPDATE users SET is_active = true WHERE email = 'user@example.com';

-- Activate ALL existing users at once (use only if you want existing users
-- to keep their access after deploying this migration):
-- UPDATE users SET is_active = true;

-- List all users and their activation status:
-- SELECT id, email, name, is_active, created_at FROM users ORDER BY created_at DESC;

-- =============================================================================
-- Verify migration:
-- \d users   →  should show is_active column
-- SELECT column_name, data_type, column_default, is_nullable
--   FROM information_schema.columns
--  WHERE table_name = 'users' AND column_name = 'is_active';
-- =============================================================================
