-- StallHq: Broadcast push content (daily tips, motivation, business ideas, announcements)
-- Admin composes pushes here; the /api/cron/push-daily job sends due ones to opted-in
-- device tokens (push_tokens) and mirrors them into user_notifications (in-app bell).

create table if not exists push_content (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  body text not null,
  type text not null default 'content',          -- content, promo, announcement, order, reply
  audience text not null default 'all',          -- all, customers, vendors, trial, paid
  send_at timestamptz not null default now(),
  status text not null default 'scheduled',      -- scheduled, sent, failed
  sent_at timestamptz,
  recipients_count int default 0,
  created_by uuid references auth.users(id),
  repeat_cadence text,
  seasonal_pack text,
  created_at timestamptz default now()
);

create index if not exists idx_push_content_status_send
  on push_content(status, send_at);

-- RLS: only the service role (API routes) may touch this table.
alter table push_content enable row level security;