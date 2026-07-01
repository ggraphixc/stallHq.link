-- Admin user setup
-- Run this AFTER creating the user in Supabase Auth dashboard
-- or after signing up via /auth/signup

-- Step 1: Create the admin user via Supabase Dashboard > Auth > Users
-- Use the Supabase dashboard to create the user with a secure password.
-- Or sign up via the app and note the user ID

-- Step 2: Get the user ID and set it as ADMIN_USER_ID in Vercel env vars
-- SELECT id, email FROM auth.users WHERE email = 'zerupth@gmail.com';

-- Step 3: If using multi-admin, add more IDs to the ADMIN_USER_ID env var (comma-separated)
-- The app reads: [process.env.ADMIN_USER_ID].filter(Boolean)

-- Step 4 (optional): Create an admin stores entry if needed
-- INSERT INTO stores (user_id, name, slug, whatsapp_number, plan)
-- VALUES ('<USER_UUID>', 'Admin Store', 'admin', '+2340000000000', 'annual')
-- ON CONFLICT (slug) DO NOTHING;
