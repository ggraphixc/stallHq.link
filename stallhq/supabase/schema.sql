-- StallHq Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Stores table
create table if not exists stores (
  id uuid default uuid_generate_v4() primary key,
  slug varchar(255) unique not null,
  name varchar(255) not null,
  description text,
  whatsapp_number varchar(50) not null,
  logo_url text,
  banner_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Products table
create table if not exists products (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references stores(id) on delete cascade not null,
  name varchar(255) not null,
  description text,
  price numeric(10, 2) not null,
  image_url text,
  category varchar(100),
  in_stock boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes
create index if not exists idx_stores_slug on stores(slug);
create index if not exists idx_products_store_id on products(store_id);
create index if not exists idx_products_category on products(category);
create index if not exists idx_products_in_stock on products(in_stock);

-- Row Level Security (RLS)
-- Enable RLS on all tables
alter table stores enable row level security;
alter table products enable row level security;

-- Public read access for stores (anyone can view a store by slug)
create policy "Public can view stores"
  on stores for select
  using (true);

-- Public read access for products (anyone can view in-stock products)
create policy "Public can view in-stock products"
  on products for select
  using (in_stock = true);

-- Authenticated users can manage their own store
create policy "Users can insert stores"
  on stores for insert
  with check (auth.uid() = id);

create policy "Users can update their own store"
  on stores for update
  using (auth.uid() = id);

-- Authenticated users can manage products in their store
create policy "Store owners can insert products"
  on products for insert
  with check (
    exists (
      select 1 from stores
      where stores.id = products.store_id
      and stores.id = auth.uid()
    )
  );

create policy "Store owners can update their products"
  on products for update
  using (
    exists (
      select 1 from stores
      where stores.id = products.store_id
      and stores.id = auth.uid()
    )
  );

create policy "Store owners can delete their products"
  on products for delete
  using (
    exists (
      select 1 from stores
      where stores.id = products.store_id
      and stores.id = auth.uid()
    )
  );

-- Storage bucket for product images
-- Run this in Supabase Storage setup
-- insert into storage.buckets (id, name, public) values ('products', 'products', true);

-- Storage policy: Public read access
-- create policy "Public read access"
--   on storage.objects for select
--   using (bucket_id = 'products');

-- Storage policy: Authenticated upload
-- create policy "Authenticated upload"
--   on storage.objects for insert
--   with check (bucket_id = 'products' and auth.role() = 'authenticated');
