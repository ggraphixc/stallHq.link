-- StallHq Email Preferences
-- Run this in your Supabase SQL Editor
-- Allows vendors to control which emails they receive

create table if not exists email_preferences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  weekly_analytics boolean default true not null,
  monthly_analytics boolean default true not null,
  trial_nurture boolean default true not null,
  order_notifications boolean default true not null,
  status_updates boolean default true not null,
  low_stock_alerts boolean default true not null,
  support_replies boolean default true not null,
  marketing_tips boolean default true not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for quick lookups
create index if not exists idx_email_preferences_user on email_preferences(user_id);

-- RLS policies
alter table email_preferences enable row level security;

-- Users can read their own preferences
create policy "Users can read own email preferences"
  on email_preferences
  for select
  using (auth.uid() = user_id);

-- Users can insert their own preferences
create policy "Users can insert own email preferences"
  on email_preferences
  for insert
  with check (auth.uid() = user_id);

-- Users can update their own preferences
create policy "Users can update own email preferences"
  on email_preferences
  for update
  using (auth.uid() = user_id);

-- Service role can read preferences (for cron emails)
create policy "Service role can read email preferences"
  on email_preferences
  for select
  using (true);
