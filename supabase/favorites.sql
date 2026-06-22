-- StallHq Favorites Table
-- Run this in your Supabase SQL Editor

-- Favorites table for wishlist (no auth required — uses device_id)
create table if not exists favorites (
  id uuid default uuid_generate_v4() primary key,
  device_id varchar(64) not null,
  product_id uuid references products(id) on delete cascade not null,
  store_id uuid references stores(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(device_id, product_id)
);

-- Indexes
create index if not exists idx_favorites_device_id on favorites(device_id);
create index if not exists idx_favorites_product_id on favorites(product_id);
create index if not exists idx_favorites_store_id on favorites(store_id);

-- RLS — permissive policies for device-based access
alter table favorites enable row level security;

-- Anyone can read their own favorites (by device_id)
create policy "Anyone can read favorites by device_id"
  on favorites for select
  using (true);

-- Anyone can insert favorites
create policy "Anyone can insert favorites"
  on favorites for insert
  with check (true);

-- Anyone can delete favorites (by device_id)
create policy "Anyone can delete favorites by device_id"
  on favorites for delete
  using (true);
