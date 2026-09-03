-- StallHq AI Moderation
-- Run this in your Supabase SQL Editor
-- Flags suspicious product listings (banned goods, spam, etc.) for admin review.

create table if not exists moderation_flags (
  id uuid default gen_random_uuid() primary key,
  store_id uuid references stores(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  product_name varchar(255) not null,
  reason text not null,
  severity varchar(20) default 'medium' check (severity in ('low', 'medium', 'high')),
  ai_reviewed boolean default false,
  status varchar(20) default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (product_id)
);

create index if not exists idx_moderation_flags_status on moderation_flags(status);
create index if not exists idx_moderation_flags_created on moderation_flags(created_at desc);

alter table moderation_flags enable row level security;

-- No public policies: the table is only read/written through the service role
-- (admin APIs), which bypasses RLS. This keeps flags invisible to vendors/customers.

-- Seed: enable the store AI assistant toggle (admin can flip it in Settings → AI)
insert into platform_settings (key, value)
values ('ai_assistant_enabled', 'false')
on conflict (key) do nothing;
