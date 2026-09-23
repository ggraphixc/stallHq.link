-- Chat room purpose + moderation columns
-- purpose restricts what kind of room it is:
--   general      → free discussion (default)
--   support      → support / help / reports only
--   announcements→ platform announcements (admin-authored)
-- is_deleted: soft-delete for spam removal by admins

ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS purpose TEXT NOT NULL DEFAULT 'general'
  CHECK (purpose IN ('general', 'support', 'announcements'));

ALTER TABLE room_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE room_messages ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);
ALTER TABLE room_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

UPDATE chat_rooms SET purpose = 'general' WHERE id = '00000000-0000-0000-0000-000000000001';
UPDATE chat_rooms SET purpose = 'support' WHERE id = '00000000-0000-0000-0000-000000000002';
UPDATE chat_rooms SET purpose = 'announcements' WHERE id = '00000000-0000-0000-0000-000000000003';
