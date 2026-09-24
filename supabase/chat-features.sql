-- Chat features: reply, reactions, read receipts, image uploads, realtime
-- Apply once in Supabase SQL editor. Safe to re-run.

-- ─── Realtime for room_messages ────────────────────────────────────────
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE room_messages;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
END $$;

-- ─── Reply ─────────────────────────────────────────────────────────────
ALTER TABLE room_messages ADD COLUMN IF NOT EXISTS reply_to UUID;
CREATE INDEX IF NOT EXISTS idx_room_messages_reply ON room_messages(reply_to);

-- Allow sender to attach reply_to / metadata / soft-delete after API insert
DROP POLICY IF EXISTS "Senders update own room messages" ON room_messages;
CREATE POLICY "Senders update own room messages"
  ON room_messages FOR UPDATE
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Optional DM reply metadata (messages table has no metadata today)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- ─── Reactions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);

-- No FK on message_id so the same table covers room_messages + messages (DM)

ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads reactions" ON message_reactions;
CREATE POLICY "Anyone reads reactions"
  ON message_reactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users insert own reactions" ON message_reactions;
CREATE POLICY "Users insert own reactions"
  ON message_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own reactions" ON message_reactions;
CREATE POLICY "Users delete own reactions"
  ON message_reactions FOR DELETE
  USING (auth.uid() = user_id);

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
END $$;

-- ─── Chat image uploads ────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can upload chat images" ON storage.objects;
CREATE POLICY "Anyone can upload chat images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Anyone can read chat images" ON storage.objects;
CREATE POLICY "Anyone can read chat images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-images');
