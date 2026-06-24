-- Add instagram_handle column to stores table
-- Vendors can now configure WhatsApp, Instagram, or both

ALTER TABLE stores ADD COLUMN IF NOT EXISTS instagram_handle VARCHAR(255) DEFAULT NULL;

-- Add check constraint: must have at least one channel (whatsapp or instagram)
-- NOTE: We keep whatsapp_number as NOT NULL for backward compat.
-- Stores created before this migration have whatsapp_number set.
-- New stores must provide at least one channel.
-- The app layer enforces the "at least one" rule.
