-- HK Trailer Parts — Supabase Schema Migration
-- Version: 001
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor -> New query)
-- Prerequisites: none (run on fresh project)

-- ============================================================
-- SECTION 1: Extensions
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- SECTION 2: Tables
-- ============================================================

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  external_id TEXT UNIQUE NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  subcategory TEXT,
  brand TEXT,
  price DECIMAL(10,2),
  image_urls TEXT[],
  primary_image_url TEXT,
  specifications JSONB,
  related_parts INTEGER[],
  alternate_skus TEXT[],
  in_stock BOOLEAN DEFAULT true,
  search_vector TSVECTOR,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  company_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cart_items (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'processing', 'completed', 'cancelled')),
  items JSONB NOT NULL,
  customer_info JSONB NOT NULL,
  total_items INTEGER NOT NULL,
  customer_notes TEXT,
  admin_notes TEXT,
  whatsapp_sent_at TIMESTAMP,
  whatsapp_message_id TEXT,
  whatsapp_error TEXT,
  contacted_at TIMESTAMP,
  contacted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE daily_analytics (
  date DATE PRIMARY KEY,
  total_orders INTEGER DEFAULT 0,
  total_inquiries INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  top_products JSONB,
  revenue DECIMAL(10,2),
  generated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sync_logs (
  id SERIAL PRIMARY KEY,
  sync_type TEXT CHECK (sync_type IN ('full', 'incremental')),
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  status TEXT CHECK (status IN ('running', 'success', 'failed')),
  products_synced INTEGER DEFAULT 0,
  products_added INTEGER DEFAULT 0,
  products_updated INTEGER DEFAULT 0,
  products_failed INTEGER DEFAULT 0,
  errors JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- SECTION 3: Indexes
-- ============================================================

-- products indexes
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_in_stock ON products(in_stock);
CREATE INDEX idx_products_search ON products USING GIN(search_vector);

-- pg_trgm trigram indexes for fuzzy search
CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);
CREATE INDEX idx_products_brand_trgm ON products USING GIN (brand gin_trgm_ops);
CREATE INDEX idx_products_category_trgm ON products USING GIN (category gin_trgm_ops);

-- profiles indexes
CREATE INDEX idx_profiles_role ON profiles(role);

-- cart_items indexes
CREATE INDEX idx_cart_items_user ON cart_items(user_id);

-- orders indexes
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_number ON orders(order_number);

-- daily_analytics indexes
CREATE INDEX idx_analytics_date ON daily_analytics(date DESC);

-- sync_logs indexes
CREATE INDEX idx_sync_logs_status ON sync_logs(status);
CREATE INDEX idx_sync_logs_started ON sync_logs(started_at DESC);

-- ============================================================
-- SECTION 4: Row Level Security
-- ============================================================

-- products: anon SELECT, admin-only write
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select_public" ON products FOR SELECT USING (true);

CREATE POLICY "products_insert_admin" ON products FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "products_update_admin" ON products FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "products_delete_admin" ON products FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- profiles: users see own row; admins see all; users update own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin" ON profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'admin'));

CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- cart_items: users manage own cart only
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cart_select_own" ON cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cart_insert_own" ON cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cart_update_own" ON cart_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cart_delete_own" ON cart_items FOR DELETE USING (auth.uid() = user_id);

-- orders: users see own; admins see all and can update
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select_own" ON orders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "orders_select_admin" ON orders FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "orders_insert_own" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_update_admin" ON orders FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- daily_analytics: admin only
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_admin_only" ON daily_analytics
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- sync_logs: admin only
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sync_logs_admin_only" ON sync_logs
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- SECTION 5: Trigger Functions and Triggers
-- ============================================================

-- Auto-create profile row on new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'customer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-generate order_number as ORD-YYYY-NNNNN
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ORD-' || to_char(NOW(), 'YYYY') || '-' || lpad(nextval('order_number_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- Auto-update search_vector on products INSERT/UPDATE
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.sku, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.brand, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.category, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_search_vector
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- Auto-update updated_at timestamp (reusable function)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- SECTION 6: Functions
-- ============================================================

-- 3-tier product search: exact SKU -> full-text -> trigram fuzzy
CREATE OR REPLACE FUNCTION search_products(
  search_query TEXT,
  category_filter TEXT DEFAULT NULL,
  brand_filter TEXT DEFAULT NULL,
  in_stock_only BOOLEAN DEFAULT false,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id INTEGER, external_id TEXT, sku TEXT, name TEXT, description TEXT,
  category TEXT, brand TEXT, price DECIMAL, primary_image_url TEXT,
  in_stock BOOLEAN, relevance FLOAT
) AS $$
BEGIN
  RETURN QUERY
  WITH
  exact_match AS (
    SELECT p.*, 1.0 as relevance FROM products p
    WHERE p.sku ILIKE search_query
      AND (category_filter IS NULL OR p.category = category_filter)
      AND (brand_filter IS NULL OR p.brand = brand_filter)
      AND (NOT in_stock_only OR p.in_stock = true)
  ),
  fulltext_match AS (
    SELECT p.*, ts_rank(p.search_vector, websearch_to_tsquery('english', search_query)) * 0.8 as relevance
    FROM products p
    WHERE p.search_vector @@ websearch_to_tsquery('english', search_query)
      AND p.id NOT IN (SELECT id FROM exact_match)
      AND (category_filter IS NULL OR p.category = category_filter)
      AND (brand_filter IS NULL OR p.brand = brand_filter)
      AND (NOT in_stock_only OR p.in_stock = true)
  ),
  fuzzy_match AS (
    SELECT p.*, 0.3 as relevance FROM products p
    WHERE (p.name % search_query OR p.category % search_query OR p.brand % search_query)
      AND p.id NOT IN (SELECT id FROM exact_match)
      AND p.id NOT IN (SELECT id FROM fulltext_match)
      AND (category_filter IS NULL OR p.category = category_filter)
      AND (brand_filter IS NULL OR p.brand = brand_filter)
      AND (NOT in_stock_only OR p.in_stock = true)
  )
  SELECT * FROM exact_match UNION ALL SELECT * FROM fulltext_match UNION ALL SELECT * FROM fuzzy_match
  ORDER BY (CASE WHEN in_stock THEN relevance ELSE relevance * 0.5 END) DESC, name ASC
  LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Cart details with product join
CREATE OR REPLACE FUNCTION get_cart_with_details(cart_user_id UUID)
RETURNS TABLE (
  cart_item_id INTEGER, product_id INTEGER, sku TEXT, name TEXT,
  price DECIMAL, primary_image_url TEXT, in_stock BOOLEAN,
  quantity INTEGER, subtotal DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT ci.id, p.id, p.sku, p.name, p.price, p.primary_image_url, p.in_stock,
         ci.quantity, (p.price * ci.quantity)
  FROM cart_items ci JOIN products p ON p.id = ci.product_id
  WHERE ci.user_id = cart_user_id ORDER BY ci.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;
