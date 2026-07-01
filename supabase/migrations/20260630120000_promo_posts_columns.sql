-- Ensure promo_posts / scheduled_promo_posts have the columns the posting
-- pipeline writes to, AND the stores table has instagram_handle.
--
-- The original promo_posts migration only created (status, error_message, created_at).
-- The API writes message_id, caption, error, posted_at. The admin monitoring UI
-- also SELECTs these. All ALTERs are idempotent (safe to re-run).
-- Note: production DB already has these columns (added manually); this migration
-- brings fresh installs + the repo schema into sync.

-- ── stores: Instagram handle (queried by orders, system, users, promo, channels, order pages) ──
ALTER TABLE stores ADD COLUMN IF NOT EXISTS instagram_handle varchar(100);

-- ── promo_posts ──
ALTER TABLE promo_posts ADD COLUMN IF NOT EXISTS message_id TEXT;     -- platform's message/post id on success
ALTER TABLE promo_posts ADD COLUMN IF NOT EXISTS caption TEXT;         -- exact text that was posted (audit)
ALTER TABLE promo_posts ADD COLUMN IF NOT EXISTS error TEXT;           -- human-readable error on failure
ALTER TABLE promo_posts ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ; -- when the post actually succeeded

-- ── scheduled_promo_posts ──
ALTER TABLE scheduled_promo_posts ADD COLUMN IF NOT EXISTS error TEXT;
ALTER TABLE scheduled_promo_posts ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ;

-- ── Backfill: migrate any legacy error_message values into `error`, then drop the old column ──
UPDATE promo_posts SET error = error_message WHERE error IS NULL AND error_message IS NOT NULL;
UPDATE scheduled_promo_posts SET error = error_message WHERE error IS NULL AND error_message IS NOT NULL;
