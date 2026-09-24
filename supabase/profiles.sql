-- StallHq Profiles Table
-- Public vendor/customer profiles keyed by auth user id
-- Run this in your Supabase SQL Editor
-- Safe to run multiple times

create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_profiles_display_name on profiles(display_name);

alter table profiles enable row level security;

drop policy if exists "Public can view profiles" on profiles;
drop policy if exists "Users can insert own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;

create policy "Public can view profiles"
  on profiles for select
  using (true);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = user_id);

-- Backfill existing auth users from metadata / email local-part
insert into profiles (user_id, display_name, created_at, updated_at)
select
  u.id,
  coalesce(
    nullif(u.raw_user_meta_data->>'name', ''),
    nullif(u.raw_user_meta_data->>'full_name', ''),
    nullif(split_part(coalesce(u.email, ''), '@', 1), '')
  ),
  u.created_at,
  u.created_at
from auth.users u
on conflict (user_id) do nothing;
