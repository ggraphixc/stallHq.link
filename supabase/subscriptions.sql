-- StallHq Subscription Bundle Matrix
-- Run this in your Supabase SQL Editor
-- Adds subscription plan tracking to the stores table

-- Add subscription columns to stores
alter table stores add column if not exists plan varchar(50) default 'trial' not null;
alter table stores add column if not exists verified boolean default false not null;
alter table stores add column if not exists trial_ends_at timestamp with time zone default (timezone('utc'::text, now()) + interval '5 days');
alter table stores add column if not exists subscription_expires_at timestamp with time zone;

-- Index for plan-based queries
create index if not exists idx_stores_plan on stores(plan);

-- Plan enum constraint
alter table stores add constraint stores_plan_check
  check (plan in ('trial', 'monthly', 'quarterly', 'annual'));

-- Comments for documentation
comment on column stores.plan is 'Subscription plan: trial (5-day free), monthly (₦3,500/mo), quarterly (₦7,500/3mo), annual (₦12,000/6mo)';
comment on column stores.verified is 'Verified vendor badge (granted on quarterly+ plans)';
comment on column stores.trial_ends_at is 'When the 5-day free trial expires';
comment on column stores.subscription_expires_at is 'When the current paid subscription expires';

-- Update existing stores to have trial plan with 5-day expiry from now
-- (only if they have no plan set yet — new column defaults handle this)
