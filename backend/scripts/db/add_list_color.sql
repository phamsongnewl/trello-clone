-- Migration: add color column to lists
ALTER TABLE lists ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT NULL;
