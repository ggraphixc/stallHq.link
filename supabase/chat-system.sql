-- ─── Chat System ────────────────────────────────────────────────────────
-- Conversations between customers and vendors, with real-time Supabase subscriptions.

-- Conversations: one per customer–store pair
CREATE TABLE IF NOT EXISTS conversations (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id      UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  vendor_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message  TEXT,
  last_message_at TIMESTAMPTZ,
  unread_customer INT DEFAULT 0,
  unread_vendor   INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, store_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_customer ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conv_vendor ON conversations(vendor_id);
CREATE INDEX IF NOT EXISTS idx_conv_store ON conversations(store_id);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role     TEXT NOT NULL CHECK (sender_role IN ('customer', 'vendor', 'admin')),
  content         TEXT NOT NULL,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_msg_sender ON messages(sender_id);

-- ─── RLS Policies ──────────────────────────────────────────────────────

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Conversations
DROP POLICY IF EXISTS "Customers see own conversations" ON conversations;
CREATE POLICY "Customers see own conversations"
  ON conversations FOR SELECT USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Vendors see own store conversations" ON conversations;
CREATE POLICY "Vendors see own store conversations"
  ON conversations FOR SELECT USING (auth.uid() = vendor_id);

DROP POLICY IF EXISTS "Customers can create conversations" ON conversations;
CREATE POLICY "Customers can create conversations"
  ON conversations FOR INSERT WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Vendors update own conversations" ON conversations;
CREATE POLICY "Vendors update own conversations"
  ON conversations FOR UPDATE USING (auth.uid() = vendor_id);

DROP POLICY IF EXISTS "Customers update own conversations" ON conversations;
CREATE POLICY "Customers update own conversations"
  ON conversations FOR UPDATE USING (auth.uid() = customer_id);

-- Messages
DROP POLICY IF EXISTS "Conversation participants see messages" ON messages;
CREATE POLICY "Conversation participants see messages"
  ON messages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (auth.uid() = c.customer_id OR auth.uid() = c.vendor_id)
    )
  );

DROP POLICY IF EXISTS "Conversation participants send messages" ON messages;
CREATE POLICY "Conversation participants send messages"
  ON messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (auth.uid() = c.customer_id OR auth.uid() = c.vendor_id)
    )
  );

DROP POLICY IF EXISTS "Participants mark messages read" ON messages;
CREATE POLICY "Participants mark messages read"
  ON messages FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (auth.uid() = c.customer_id OR auth.uid() = c.vendor_id)
    )
  );

-- ─── Realtime ──────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- ─── Helper: trigger to update conversation on new message ─────────────

CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET
    last_message = NEW.content,
    last_message_at = NEW.created_at,
    updated_at = now(),
    unread_customer = CASE WHEN NEW.sender_role = 'vendor' THEN unread_customer + 1 ELSE unread_customer END,
    unread_vendor = CASE WHEN NEW.sender_role = 'customer' THEN unread_vendor + 1 ELSE unread_vendor END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_new_message ON messages;
CREATE TRIGGER on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();
