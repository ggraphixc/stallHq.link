-- Ensure promo_posts has the columns the posting pipeline writes to.
-- The original migration only created (status, error_message, created_at);
-- the API writes message_id, caption, error, posted_at. These ALTERs are
-- idempotent (safe to re-run) so logging never fails on an older schema.

-- message_id: the platform's message/post id returned on success
ALTER TABLE promo_posts ADD COLUMN IF NOT EXISTS message_id TEXT;

-- caption: the exact text that was posted (audit)
ALTER TABLE promo_posts ADD COLUMN IF NOT EXISTS caption TEXT;

-- error: human-readable error message on failure
ALTER TABLE promo_posts ADD COLUMN IF NOT EXISTS error TEXT;

-- posted_at: when the post actually succeeded (distinct from created_at)
ALTER TABLE promo_posts ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ;

-- scheduled_promo_posts already had posted_at, but ensure it too
ALTER TABLE scheduled_promo_posts ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ;
