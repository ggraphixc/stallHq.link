-- StallHq: Store reviews + product reports + customer accounts groundwork
-- Run this in your Supabase SQL Editor (idempotent — safe to run multiple times)

-- ─────────────────────────────────────────────────────────────
-- 1. Reviews: allow store-level reviews (product_id optional)
--    + track reviewer identity (user_id) for ownership/monitoring
-- ─────────────────────────────────────────────────────────────
alter table reviews alter column product_id drop not null;
alter table reviews add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table reviews add column if not exists updated_at timestamptz default now();

create index if not exists idx_reviews_user_id on reviews(user_id);

drop policy if exists "Anyone can create reviews" on reviews;
drop policy if exists "Store owners can delete reviews" on reviews;

-- Anyone can leave a review (product OR store level)
create policy "Anyone can create reviews"
  on reviews for insert
  with check (true);

-- Store owners can remove reviews about their store (product or store level)
create policy "Store owners can delete reviews"
  on reviews for delete
  using (
    exists (
      select 1 from stores
      where stores.id = reviews.store_id
      and stores.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 2. product_reports — user-submitted reports on product listings
-- ─────────────────────────────────────────────────────────────
create table if not exists product_reports (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references products(id) on delete cascade not null,
  store_id uuid references stores(id) on delete cascade not null,
  reporter_name varchar(100),
  reporter_email varchar(255),
  reason varchar(50) not null check (reason in (
    'fake', 'counterfeit', 'misleading', 'prohibited', 'offensive', 'other'
  )),
  details text,
  status varchar(20) default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_product_reports_status on product_reports(status);
create index if not exists idx_product_reports_store on product_reports(store_id);
create index if not exists idx_product_reports_created on product_reports(created_at desc);

alter table product_reports enable row level security;

-- Anyone can submit a report (anonymous marketplace)
drop policy if exists "Anyone can insert product reports" on product_reports;
create policy "Anyone can insert product reports"
  on product_reports for insert
  with check (true);

-- Store owners can view & manage reports on their own products
drop policy if exists "Store owners can view own product reports" on product_reports;
create policy "Store owners can view own product reports"
  on product_reports for select
  using (
    exists (
      select 1 from stores
      where stores.id = product_reports.store_id
      and stores.user_id = auth.uid()
    )
  );

drop policy if exists "Store owners can update own product reports" on product_reports;
create policy "Store owners can update own product reports"
  on product_reports for update
  using (
    exists (
      select 1 from stores
      where stores.id = product_reports.store_id
      and stores.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from stores
      where stores.id = product_reports.store_id
      and stores.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 3. Review moderation: hidden flag for admin soft-hide
-- ─────────────────────────────────────────────────────────────
alter table reviews add column if not exists hidden boolean not null default false;

create index if not exists idx_reviews_hidden on reviews(hidden);

-- Public (anon) reads exclude hidden reviews; store owners still see
-- reviews about their own store (incl. hidden) so they can appeal.
drop policy if exists "Public can view reviews" on reviews;
drop policy if exists "Public can view non-hidden reviews" on reviews;
create policy "Public can view non-hidden reviews"
  on reviews for select
  using (
    hidden = false
    or exists (
      select 1 from stores
      where stores.id = reviews.store_id
      and stores.user_id = auth.uid()
    )
  );

-- Review authors can edit or delete their own reviews
-- (matches the web API DELETE guard which already allows the author)
drop policy if exists "Review authors can update own reviews" on reviews;
drop policy if exists "Review authors can delete own reviews" on reviews;
create policy "Review authors can update own reviews"
  on reviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "Review authors can delete own reviews"
  on reviews for delete
  using (auth.uid() = user_id);

-- Store owners can update reviews about their store (public reply, edit)
-- Delete rights already covered by "Store owners can delete reviews".
drop policy if exists "Store owners can update reviews" on reviews;
create policy "Store owners can update reviews"
  on reviews for update
  using (
    exists (
      select 1 from stores
      where stores.id = reviews.store_id
      and stores.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from stores
      where stores.id = reviews.store_id
      and stores.user_id = auth.uid()
    )
  );

-- Owner public reply on a review (single reply per review)
alter table reviews add column if not exists reply text;
alter table reviews add column if not exists replied_at timestamptz;

-- ─────────────────────────────────────────────────────────────
-- 4. review_reports — customers can flag abusive reviews
-- ─────────────────────────────────────────────────────────────
create table if not exists review_reports (
  id uuid default gen_random_uuid() primary key,
  review_id uuid references reviews(id) on delete cascade not null,
  store_id uuid references stores(id) on delete cascade not null,
  reporter_name varchar(100),
  reason varchar(50) not null check (reason in (
    'fake', 'offensive', 'spam', 'harassment', 'irrelevant', 'other'
  )),
  details text,
  status varchar(20) default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_review_reports_status on review_reports(status);
create index if not exists idx_review_reports_review on review_reports(review_id);
create index if not exists idx_review_reports_store on review_reports(store_id);

alter table review_reports enable row level security;

-- Anyone can report a review (anonymous marketplace)
drop policy if exists "Anyone can insert review reports" on review_reports;
create policy "Anyone can insert review reports"
  on review_reports for insert
  with check (true);

-- Store owners can view & resolve reports about their store's reviews
drop policy if exists "Store owners can view own review reports" on review_reports;
create policy "Store owners can view own review reports"
  on review_reports for select
  using (
    exists (
      select 1 from stores
      where stores.id = review_reports.store_id
      and stores.user_id = auth.uid()
    )
  );

drop policy if exists "Store owners can update own review reports" on review_reports;
create policy "Store owners can update own review reports"
  on review_reports for update
  using (
    exists (
      select 1 from stores
      where stores.id = review_reports.store_id
      and stores.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from stores
      where stores.id = review_reports.store_id
      and stores.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 5. Customer accounts groundwork
--    users are created via /api/auth/signup (admin API). Nothing
--    to migrate here, but ensure no store rows exist for users
--    who are only customers (stores.user_id remains the flag).
-- ─────────────────────────────────────────────────────────────
-- (no-op placeholder — keeps the file self-documenting)

-- ─────────────────────────────────────────────────────────────
-- 6. Resolution history — track WHO resolved a report and WHEN
--    so vendors & admins can audit past moderation actions.
-- ─────────────────────────────────────────────────────────────
alter table product_reports add column if not exists resolved_by uuid references auth.users(id) on delete set null;
alter table product_reports add column if not exists resolved_at timestamptz;
alter table review_reports add column if not exists resolved_by uuid references auth.users(id) on delete set null;
alter table review_reports add column if not exists resolved_at timestamptz;
alter table moderation_flags add column if not exists resolved_by uuid references auth.users(id) on delete set null;
alter table moderation_flags add column if not exists resolved_at timestamptz;

create index if not exists idx_product_reports_resolved on product_reports(resolved_at desc);
create index if not exists idx_review_reports_resolved on review_reports(resolved_at desc);
create index if not exists idx_moderation_flags_resolved on moderation_flags(resolved_at desc);

-- Keep updated_at in sync when a report is resolved (safety net for direct updates)
drop trigger if exists trg_reports_touch_updated on product_reports;
create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger trg_reports_touch_updated
  before update on product_reports
  for each row execute function touch_updated_at();

drop trigger if exists trg_review_reports_touch_updated on review_reports;
create trigger trg_review_reports_touch_updated
  before update on review_reports
  for each row execute function touch_updated_at();

drop trigger if exists trg_moderation_flags_touch_updated on moderation_flags;
create trigger trg_moderation_flags_touch_updated
  before update on moderation_flags
  for each row execute function touch_updated_at();
