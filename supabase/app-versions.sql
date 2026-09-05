-- StallHq: Mobile app version & distribution settings
-- Run this in your Supabase SQL Editor (idempotent — safe to re-run).
--
-- The admin portal (Admin → Settings → Mobile App) edits these keys.
-- The public API GET /api/app-version reads them so the web homepage,
-- storefront footers and the mobile app can resolve versions/downloads.
--
-- platform_settings already exists (support-tickets.sql) with public-read RLS.

insert into platform_settings (key, value) values
  -- Android (APK sideload today; Play Store link later)
  ('android_version', '"1.0.0"'),
  ('android_version_code', '1'),
  ('android_min_version', '"1.0.0"'),
  ('android_download_url', '""'),
  -- iOS (App Store link once published)
  ('ios_version', '"1.0.0"'),
  ('ios_min_version', '"1.0.0"'),
  ('ios_download_url', '""'),
  -- Shown on the web app section + the in-app force-update screen
  ('app_release_notes', '""')
on conflict (key) do nothing;

-- Semantics:
--   android_version      — latest published Android version ("1.0.0")
--   android_version_code — latest Android build number (integer)
--   android_min_version  — versions BELOW this are force-updated on app launch
--   *_download_url       — direct APK URL or App Store URL ("" = not yet published)
