-- StallHq Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Stores table
create table if not exists stores (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  slug varchar(255) unique not null,
  name varchar(255) not null,
  description text,
  whatsapp_number varchar(50) not null,
  logo_url text,
  banner_url text,
  category varchar(100),
  theme jsonb,
  store_hours jsonb,
  email varchar(255),
  setup_complete boolean default false not null,
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
  images jsonb default '[]'::jsonb,
  category varchar(100),
  in_stock boolean default true not null,
  has_variants boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Product variants table (size, color, etc.)
create table if not exists product_variants (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references products(id) on delete cascade not null,
  name varchar(255) not null,
  option_name varchar(100) not null,
  option_value varchar(100) not null,
  price numeric(10, 2),
  stock integer default 0,
  sku varchar(100),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Orders table for tracking WhatsApp orders
create table if not exists orders (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references stores(id) on delete cascade not null,
  customer_name varchar(255),
  customer_phone varchar(50),
  customer_email varchar(255),
  items jsonb not null,
  total numeric(10, 2) not null,
  status varchar(50) default 'pending' not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes
create index if not exists idx_stores_slug on stores(slug);
create index if not exists idx_stores_category on stores(category);
create index if not exists idx_products_store_id on products(store_id);
create index if not exists idx_products_category on products(category);
create index if not exists idx_products_in_stock on products(in_stock);
create index if not exists idx_product_variants_product_id on product_variants(product_id);
create index if not exists idx_orders_store_id on orders(store_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created_at on orders(created_at);

-- Analytics table for tracking store visits and events
create table if not exists analytics (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references stores(id) on delete cascade not null,
  event_type varchar(50) not null, -- 'visit', 'whatsapp_click', 'product_view'
  product_id uuid references products(id) on delete set null,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for analytics
create index if not exists idx_analytics_store_id on analytics(store_id);
create index if not exists idx_analytics_event_type on analytics(event_type);
create index if not exists idx_analytics_created_at on analytics(created_at);
create index if not exists idx_analytics_store_event on analytics(store_id, event_type);

-- Row Level Security (RLS)
-- Enable RLS on all tables
alter table stores enable row level security;
alter table products enable row level security;
alter table analytics enable row level security;
alter table product_variants enable row level security;
alter table orders enable row level security;

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
  with check (auth.uid() = user_id);

create policy "Users can update their own store"
  on stores for update
  using (auth.uid() = user_id);

-- Authenticated users can manage products in their store
create policy "Store owners can insert products"
  on products for insert
  with check (
    exists (
      select 1 from stores
      where stores.id = products.store_id
      and stores.user_id = auth.uid()
    )
  );

create policy "Store owners can update their products"
  on products for update
  using (
    exists (
      select 1 from stores
      where stores.id = products.store_id
      and stores.user_id = auth.uid()
    )
  );

create policy "Store owners can delete their products"
  on products for delete
  using (
    exists (
      select 1 from stores
      where stores.id = products.store_id
      and stores.user_id = auth.uid()
    )
  );

-- Product variants policies
create policy "Public can view product variants"
  on product_variants for select
  using (true);

create policy "Store owners can manage product variants"
  on product_variants for all
  using (
    exists (
      select 1 from products
      join stores on stores.id = products.store_id
      where products.id = product_variants.product_id
      and stores.user_id = auth.uid()
    )
  );

-- Orders policies
create policy "Store owners can view their orders"
  on orders for select
  using (
    exists (
      select 1 from stores
      where stores.id = orders.store_id
      and stores.user_id = auth.uid()
    )
  );

create policy "Anyone can create orders"
  on orders for insert
  with check (true);

create policy "Store owners can update their orders"
  on orders for update
  using (
    exists (
      select 1 from stores
      where stores.id = orders.store_id
      and stores.user_id = auth.uid()
    )
  );

-- Storage buckets for images
insert into storage.buckets (id, name, public) values ('products', 'products', true)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('store-assets', 'store-assets', true)
on conflict (id) do nothing;

-- Storage policy: Public read access for products
create policy "Public read access for products"
  on storage.objects for select
  using (bucket_id = 'products' and auth.role() = 'authenticated');

-- Storage policy: Public read access for store assets
create policy "Public read access for store assets"
  on storage.objects for select
  using (bucket_id = 'store-assets' and auth.role() = 'authenticated');

-- Storage policy: Authenticated upload to products
create policy "Authenticated upload to products"
  on storage.objects for insert
  with check (bucket_id = 'products' and auth.role() = 'authenticated');

-- Storage policy: Authenticated upload to store-assets
create policy "Authenticated upload to store-assets"
  on storage.objects for insert
  with check (bucket_id = 'store-assets' and auth.role() = 'authenticated');

-- Storage policy: Users can update their own uploads
create policy "Users can update own uploads"
  on storage.objects for update
  using (auth.role() = 'authenticated');

-- Storage policy: Users can delete their own uploads
create policy "Users can delete own uploads"
  on storage.objects for delete
  using (auth.role() = 'authenticated');

-- Analytics policies
-- Anyone can insert analytics events (for tracking visits from public pages)
create policy "Anyone can insert analytics"
  on analytics for insert
  with check (true);

-- Store owners can view their own analytics
create policy "Store owners can view own analytics"
  on analytics for select
  using (
    exists (
      select 1 from stores
      where stores.id = analytics.store_id
      and stores.user_id = auth.uid()
    )
  );
