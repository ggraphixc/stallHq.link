-- Hardens the create-or-find conversation flow (POST /api/chat storeId branch).
--
-- The API previously upserted conversations with ON CONFLICT (customer_id, store_id),
-- but no unique index existed on that column pair, so the upsert failed with
-- "no unique or exclusion constraint matching the ON CONFLICT specification".
-- The API now does a SELECT-then-INSERT (with a 23505 race fallback), so it no
-- longer depends on this index. This migration is a safety net that guarantees
-- one conversation per customer/store pair even under concurrent requests.
--
-- Idempotent: safe to run repeatedly in the Supabase SQL Editor.

CREATE UNIQUE INDEX IF NOT EXISTS uniq_conv_customer_store
  ON conversations (customer_id, store_id)
  WHERE store_id IS NOT NULL;
