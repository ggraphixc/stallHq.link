-- StallHq store visibility fix
-- Stores only appear in the Explore directory (web + mobile) when
-- `setup_complete = true`. Existing stores created before onboarding set the
-- flag are invisible. Run this in your Supabase SQL Editor.

-- Show every store that is currently invisible:
-- select id, name, slug, setup_complete, created_at from stores order by created_at desc;

-- Make all stores discoverable (they have products / were onboarded).
update stores
set setup_complete = true
where setup_complete is distinct from true;
