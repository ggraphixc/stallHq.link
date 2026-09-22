-- Global chat room tables
-- Rooms: public (anyone can join), private (invite-only), admin-only

CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'public' CHECK (type IN ('public', 'private', 'admin')),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, user_id)
);

CREATE TABLE IF NOT EXISTS room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  metadata JSONB DEFAULT '{}',
  read_by UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS room_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_muted BOOLEAN DEFAULT false,
  is_dm BOOLEAN DEFAULT true,
  last_read_at TIMESTAMPTZ,
  unread_count INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_room_messages_room ON room_messages(room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_room_members_room ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user ON room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_room_notifications_user ON room_notifications(user_id, is_muted);
CREATE INDEX IF NOT EXISTS idx_room_notifications_room ON room_notifications(room_id);

-- RLS
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public rooms visible to all" ON chat_rooms
  FOR SELECT USING (type = 'public' OR is_active = true);

CREATE POLICY "Members can read room messages" ON room_messages
  FOR SELECT USING (
    room_id IN (SELECT room_id FROM room_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can insert messages" ON room_messages
  FOR INSERT WITH CHECK (
    room_id IN (SELECT room_id FROM room_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can view their notifications" ON room_notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Members can update notifications" ON room_notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Default rooms
INSERT INTO chat_rooms (id, name, description, type, created_by) VALUES
  ('00000000-0000-0000-0000-000000000001', 'General', 'General discussion for all users', 'public', NULL),
  ('00000000-0000-0000-0000-000000000002', 'Support', 'Customer support and help', 'public', NULL),
  ('00000000-0000-0000-0000-000000000003', 'Announcements', 'Platform announcements', 'admin', NULL);

-- Add all existing users to general room
INSERT INTO room_members (room_id, user_id, role)
  SELECT '00000000-0000-0000-0000-000000000001', id, 'member'
  FROM auth.users
  ON CONFLICT DO NOTHING;
