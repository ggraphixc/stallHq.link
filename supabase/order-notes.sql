-- StallHq: Add vendor_notes column to orders
-- Run this in your Supabase SQL Editor

-- Vendor notes: updates from vendor visible to customer (status context like "shipped via GIG")
ALTER TABLE orders ADD COLUMN IF NOT EXISTS vendor_notes text;

-- Update RLS: customers can read vendor_notes on their orders
-- (The existing permissive SELECT policy already allows this since customers can read their own orders)
