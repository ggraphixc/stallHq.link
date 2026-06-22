-- StallHq: Customer accounts, inventory alerts, store themes
-- Run this in your Supabase SQL Editor

-- ── Feature 3: Customer order lookup ────────────────────────────────
-- Add customer_id to orders (nullable for anonymous orders)
alter table orders add column if not exists customer_id varchar(64);

create index if not exists idx_orders_customer_id on orders(customer_id);

-- ── Feature 4: Inventory alerts ────────────────────────────────────
-- Low stock threshold and alerts toggle on stores
alter table stores add column if not exists low_stock_threshold integer default 5;
alter table stores add column if not exists stock_alerts_enabled boolean default true;

-- ── Feature 6: Store fonts ─────────────────────────────────────────
-- Add font fields to stores (stored in theme jsonb, but explicit for indexing)
-- font_heading and font_body are stored in the theme jsonb column
