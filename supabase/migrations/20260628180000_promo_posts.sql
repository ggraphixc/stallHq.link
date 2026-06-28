-- Promo posts logging table
CREATE TABLE IF NOT EXISTS promo_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('whatsapp', 'instagram')),
  status TEXT NOT NULL DEFAULT 'posted' CHECK (status IN ('posted', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Scheduled promo posts table
CREATE TABLE IF NOT EXISTS scheduled_promo_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('whatsapp', 'instagram', 'both')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_promo_posts_store ON promo_posts(store_id);
CREATE INDEX IF NOT EXISTS idx_promo_posts_product ON promo_posts(product_id);
CREATE INDEX IF NOT EXISTS idx_promo_posts_created ON promo_posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scheduled_promo_posts_store ON scheduled_promo_posts(store_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_promo_posts_status ON scheduled_promo_posts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_promo_posts_scheduled ON scheduled_promo_posts(scheduled_at) WHERE status = 'pending';

-- RLS policies
ALTER TABLE promo_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_promo_posts ENABLE ROW LEVEL SECURITY;

-- Vendors can read their own promo posts
CREATE POLICY "Vendors read own promo posts" ON promo_posts
  FOR SELECT USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );

-- Vendors can insert their own promo posts
CREATE POLICY "Vendors insert own promo posts" ON promo_posts
  FOR INSERT WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );

-- Vendors can read their own scheduled posts
CREATE POLICY "Vendors read own scheduled posts" ON scheduled_promo_posts
  FOR SELECT USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );

-- Vendors can manage their own scheduled posts
CREATE POLICY "Vendors insert own scheduled posts" ON scheduled_promo_posts
  FOR INSERT WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );

CREATE POLICY "Vendors update own scheduled posts" ON scheduled_promo_posts
  FOR UPDATE USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );

CREATE POLICY "Vendors delete own scheduled posts" ON scheduled_promo_posts
  FOR DELETE USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );

-- Admin access handled via service-role client (bypasses RLS) — no profiles table needed
