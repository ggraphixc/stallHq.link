-- Add rich content columns to user_notifications
-- Run this in Supabase SQL editor

ALTER TABLE user_notifications ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE user_notifications ADD COLUMN IF NOT EXISTS action_label TEXT;
ALTER TABLE user_notifications ADD COLUMN IF NOT EXISTS action_link TEXT;
ALTER TABLE user_notifications ADD COLUMN IF NOT EXISTS sent_by UUID REFERENCES auth.users(id);

-- Add index for admin-sent notifications
CREATE INDEX IF NOT EXISTS idx_user_notif_sent_by ON user_notifications(sent_by);
