-- StallHq Store Favorites Table
-- Allows customers to favorite entire stores (not just products)

create table if not exists store_favorites (
  id uuid default uuid_generate_v4() primary key,
  device_id varchar(64) not null,
  store_id uuid references stores(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(device_id, store_id)
);

-- Indexes
create index if not exists idx_store_favorites_device_id on store_favorites(device_id);
create index if not exists idx_store_favorites_store_id on store_favorites(store_id);

-- RLS
alter table store_favorites enable row level security;

create policy "Anyone can read store favorites by device_id"
  on store_favorites for select
  using (true);

create policy "Anyone can insert store favorites"
  on store_favorites for insert
  with check (true);

create policy "Anyone can delete store favorites by device_id"
  on store_favorites for delete
  using (true);
