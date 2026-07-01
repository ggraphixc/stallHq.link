-- Auth tables for custom email verification and password reset
-- Run this in your Supabase SQL Editor

-- Email verification tokens
create table if not exists email_verifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  email varchar(255) not null,
  code varchar(10) not null,
  type varchar(20) not null default 'signup', -- 'signup', 'email_change'
  expires_at timestamp with time zone not null,
  used boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Password reset tokens
create table if not exists password_resets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  email varchar(255) not null,
  token varchar(64) not null,
  expires_at timestamp with time zone not null,
  used boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes
create index if not exists idx_email_verifications_user_id on email_verifications(user_id);
create index if not exists idx_email_verifications_code on email_verifications(code);
create index if not exists idx_email_verifications_email on email_verifications(email);
create index if not exists idx_password_resets_user_id on password_resets(user_id);
create index if not exists idx_password_resets_token on password_resets(token);
create index if not exists idx_password_resets_email on password_resets(email);

-- RLS — enabled but NO policies = only service-role (bypasses RLS) can access.
-- Anonymous/auth users cannot read or write these tables.
alter table email_verifications enable row level security;
alter table password_resets enable row level security;

-- Drop any existing permissive policies
drop policy if exists "Service role can manage email_verifications" on email_verifications;
drop policy if exists "Service role can manage password_resets" on password_resets;
