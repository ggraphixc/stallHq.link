-- StallHq: Add review photos support
-- Adds a photos column to the reviews table for image URLs

alter table reviews add column if not exists photos text[] default '{}';

create index if not exists idx_reviews_photos on reviews using gin(photos);

-- Public storage bucket for review photos (created idempotently)
insert into storage.buckets (id, name, public)
values ('review-photos', 'review-photos', true)
on conflict (id) do nothing;

-- Allow any signed-in user to upload into the review-photos bucket
drop policy if exists "Anyone can upload review photos" on storage.objects;
create policy "Anyone can upload review photos"
  on storage.objects for insert
  with check (bucket_id = 'review-photos');

drop policy if exists "Anyone can read review photos" on storage.objects;
create policy "Anyone can read review photos"
  on storage.objects for select
  using (bucket_id = 'review-photos');
