-- StallHq: Vendor support tickets & admin replies
-- Run this in your Supabase SQL Editor

-- ── Support tickets ─────────────────────────────────────────────────
create table if not exists support_tickets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  store_id uuid references stores(id) on delete set null,
  subject varchar(255) not null,
  category varchar(50) default 'general' check (category in ('general', 'billing', 'technical', 'feature_request', 'bug_report')),
  status varchar(20) default 'open' check (status in ('open', 'in_progress', 'replied', 'resolved', 'closed')),
  priority varchar(10) default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ── Support messages (conversation thread) ──────────────────────────
create table if not exists support_messages (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references support_tickets(id) on delete cascade not null,
  sender_id uuid references auth.users(id) on delete set null,
  sender_role varchar(10) not null check (sender_role in ('vendor', 'admin')),
  message text not null,
  created_at timestamp with time zone default now()
);

-- ── Admin notifications (system-wide announcements/logs) ────────────
create table if not exists admin_notifications (
  id uuid default gen_random_uuid() primary key,
  title varchar(255) not null,
  body text not null,
  type varchar(30) default 'info' check (type in ('info', 'warning', 'success', 'error', 'announcement')),
  target varchar(20) default 'all' check (target in ('all', 'trial', 'monthly', 'quarterly', 'annual')),
  sent_by uuid references auth.users(id) on delete set null,
  sent_at timestamp with time zone default now(),
  read_by uuid[] default '{}'
);

-- ── Platform settings (key-value config store) ──────────────────────
create table if not exists platform_settings (
  key varchar(100) primary key,
  value jsonb not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamp with time zone default now()
);

-- ── Indexes ─────────────────────────────────────────────────────────
create index if not exists idx_support_tickets_user on support_tickets(user_id);
create index if not exists idx_support_tickets_status on support_tickets(status);
create index if not exists idx_support_messages_ticket on support_messages(ticket_id);
create index if not exists idx_admin_notifications_sent on admin_notifications(sent_at desc);

-- ── Insert default platform settings ────────────────────────────────
insert into platform_settings (key, value) values
  ('brevo_sender_email', '"ggraphixc@gmail.com"'),
  ('brevo_sender_name', '"StallHq"'),
  ('app_name', '"StallHq"'),
  ('app_url', '"https://hqlink.vercel.app"'),
  ('maintenance_mode', 'false'),
  ('allow_signup', 'true'),
  ('max_free_products', '10'),
  ('trial_days', '5'),
  ('support_email', '"support@stallhq.link"')
on conflict (key) do nothing;

-- ── RLS policies ────────────────────────────────────────────────────
alter table support_tickets enable row level security;
alter table support_messages enable row level security;
alter table admin_notifications enable row level security;
alter table platform_settings enable row level security;

-- Support tickets: vendors see own, admins see all
create policy "Vendors view own tickets" on support_tickets
  for select using (auth.uid() = user_id);

create policy "Vendors create tickets" on support_tickets
  for insert with check (auth.uid() = user_id);

create policy "Vendors update own tickets" on support_tickets
  for update using (auth.uid() = user_id);

-- Support messages: participants see thread
create policy "Ticket participants view messages" on support_messages
  for select using (
    ticket_id in (select id from support_tickets where user_id = auth.uid())
    or sender_id = auth.uid()
  );

create policy "Participants send messages" on support_messages
  for insert with check (
    sender_id = auth.uid()
    and ticket_id in (select id from support_tickets where user_id = auth.uid())
  );

-- Admin notifications: everyone reads, only admins insert
create policy "Anyone reads notifications" on admin_notifications
  for select using (true);

-- Platform settings: everyone reads
create policy "Anyone reads settings" on platform_settings
  for select using (true);
