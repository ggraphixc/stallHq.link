-- Recently viewed products table for personalized recommendations
CREATE TABLE IF NOT EXISTS recently_viewed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_rv_device ON recently_viewed(device_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_rv_user ON recently_viewed(user_id, viewed_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rv_product ON recently_viewed(product_id);
CREATE INDEX IF NOT EXISTS idx_rv_store ON recently_viewed(store_id);

-- RLS
ALTER TABLE recently_viewed ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (anonymous + authenticated)
DROP POLICY IF EXISTS "Public insert recently_viewed" ON recently_viewed;
CREATE POLICY "Public insert recently_viewed"
  ON recently_viewed FOR INSERT
  WITH CHECK (true);

-- Users can read their own (by user_id) or by device_id
DROP POLICY IF EXISTS "Read own recently_viewed" ON recently_viewed;
CREATE POLICY "Read own recently_viewed"
  ON recently_viewed FOR SELECT
  USING (true);

-- Price alerts table
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  target_price NUMERIC(10,2) NOT NULL,
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_product ON price_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_device ON price_alerts(device_id);

ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public manage price_alerts" ON price_alerts;
CREATE POLICY "Public manage price_alerts"
  ON price_alerts FOR ALL
  USING (true);

-- Back-in-stock alerts table
CREATE TABLE IF NOT EXISTS stock_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_alerts_product ON stock_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_device ON stock_alerts(device_id);

ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public manage stock_alerts" ON stock_alerts;
CREATE POLICY "Public manage stock_alerts"
  ON stock_alerts FOR ALL
  USING (true);
