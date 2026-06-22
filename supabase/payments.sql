-- StallHq Payments Table
-- Run this in your Supabase SQL Editor after subscriptions.sql

-- Payments table for tracking Paystack transactions
create table if not exists payments (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references stores(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  plan varchar(50) not null,
  amount integer not null,          -- in kobo (₦3,500 = 350000)
  currency varchar(3) default 'NGN' not null,
  paystack_reference varchar(255) unique not null,
  paystack_access_code varchar(255),
  paystack_status varchar(50) default 'pending',
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes
create index if not exists idx_payments_store_id on payments(store_id);
create index if not exists idx_payments_user_id on payments(user_id);
create index if not exists idx_payments_reference on payments(paystack_reference);
create index if not exists idx_payments_status on payments(paystack_status);

-- RLS
alter table payments enable row level security;

-- Store owners can view their own payments
create policy "Store owners can view their payments"
  on payments for select
  using (
    exists (
      select 1 from stores
      where stores.id = payments.store_id
      and stores.user_id = auth.uid()
    )
  );

-- Only service role can insert/update payments (via API routes)
-- No insert/update policies for regular users — handled by service-role client
