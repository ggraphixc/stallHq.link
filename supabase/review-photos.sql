-- StallHq: Add review photos support
-- Adds a photos column to the reviews table for image URLs

alter table reviews add column if not exists photos text[] default '{}';

create index if not exists idx_reviews_photos on reviews using gin(photos);
