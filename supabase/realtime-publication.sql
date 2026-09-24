-- Realtime publication for chat tables
-- chat-system.sql already adds `messages` and `conversations`.
-- `room_messages` was missing, so community/DM room clients never received
-- INSERT/UPDATE events (new messages, read receipts, reaction metadata).
-- Idempotent: safe to run multiple times.

DO $$
BEGIN
  IF to_regclass('public.room_messages') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'room_messages'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
  END IF;

  IF to_regclass('public.messages') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'messages'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF to_regclass('public.conversations') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'conversations'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
END $$;
