-- StallHq Analytics Aggregation
-- Run this in your Supabase SQL Editor
-- Creates a daily rollup table to prevent analytics table bloat

-- Create analytics_aggregates table
create table if not exists analytics_aggregates (
  id uuid default gen_random_uuid() primary key,
  store_id uuid references stores(id) on delete cascade not null,
  date date not null,
  visits integer default 0,
  whatsapp_clicks integer default 0,
  product_views integer default 0,
  unique_visitors integer default 0,
  created_at timestamptz default now(),
  unique (store_id, date)
);

-- Indexes for fast queries
create index if not exists idx_analytics_aggregates_store_date on analytics_aggregates(store_id, date);
create index if not exists idx_analytics_aggregates_date on analytics_aggregates(date);

-- RLS policies
alter table analytics_aggregates enable row level security;

-- Public read for store owners
create policy "Store owners can read their aggregates"
  on analytics_aggregates
  for select
  using (
    store_id in (
      select id from stores where user_id = auth.uid()
    )
  );

-- Service role can insert/update (for cron)
create policy "Service role can manage aggregates"
  on analytics_aggregates
  for all
  using (true)
  with check (true);
