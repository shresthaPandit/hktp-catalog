-- Migration 002: Fix search_products — partial SKU + alternate_skus + safe special chars
-- Run in Supabase SQL Editor

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
DECLARE
  clean_query    TEXT := trim(search_query);
  -- Strip special chars for full-text (keep letters, digits, spaces)
  ft_query       TEXT := trim(regexp_replace(clean_query, '[^a-zA-Z0-9 ]', ' ', 'g'));
BEGIN
  -- Empty query: return all products (browse mode)
  IF clean_query = '' OR clean_query IS NULL THEN
    RETURN QUERY
    SELECT p.id, p.external_id, p.sku, p.name, p.description,
           p.category, p.brand, p.price, p.primary_image_url,
           p.in_stock, 0.5::FLOAT
    FROM products p
    WHERE (category_filter IS NULL OR p.category = category_filter)
      AND (brand_filter IS NULL OR p.brand = brand_filter)
      AND (NOT in_stock_only OR p.in_stock = true)
    ORDER BY p.name ASC
    LIMIT limit_count OFFSET offset_count;
    RETURN;
  END IF;

  RETURN QUERY
  WITH
  -- Tier 1: exact SKU match
  exact_sku AS (
    SELECT p.id, p.external_id, p.sku, p.name, p.description,
           p.category, p.brand, p.price, p.primary_image_url,
           p.in_stock, 1.0::FLOAT as relevance
    FROM products p
    WHERE p.sku ILIKE clean_query
      AND (category_filter IS NULL OR p.category = category_filter)
      AND (brand_filter IS NULL OR p.brand = brand_filter)
      AND (NOT in_stock_only OR p.in_stock = true)
  ),
  -- Tier 2: exact alternate SKU
  exact_alt AS (
    SELECT p.id, p.external_id, p.sku, p.name, p.description,
           p.category, p.brand, p.price, p.primary_image_url,
           p.in_stock, 0.95::FLOAT
    FROM products p
    WHERE p.alternate_skus IS NOT NULL
      AND EXISTS (SELECT 1 FROM unnest(p.alternate_skus) alt WHERE alt ILIKE clean_query)
      AND p.id NOT IN (SELECT es.id FROM exact_sku es)
      AND (category_filter IS NULL OR p.category = category_filter)
      AND (brand_filter IS NULL OR p.brand = brand_filter)
      AND (NOT in_stock_only OR p.in_stock = true)
  ),
  -- Tier 3: partial SKU (contains)
  partial_sku AS (
    SELECT p.id, p.external_id, p.sku, p.name, p.description,
           p.category, p.brand, p.price, p.primary_image_url,
           p.in_stock, 0.9::FLOAT
    FROM products p
    WHERE p.sku ILIKE '%' || clean_query || '%'
      AND p.id NOT IN (SELECT es.id FROM exact_sku es)
      AND p.id NOT IN (SELECT ea.id FROM exact_alt ea)
      AND (category_filter IS NULL OR p.category = category_filter)
      AND (brand_filter IS NULL OR p.brand = brand_filter)
      AND (NOT in_stock_only OR p.in_stock = true)
  ),
  -- Tier 4: partial alternate SKU
  partial_alt AS (
    SELECT p.id, p.external_id, p.sku, p.name, p.description,
           p.category, p.brand, p.price, p.primary_image_url,
           p.in_stock, 0.85::FLOAT
    FROM products p
    WHERE p.alternate_skus IS NOT NULL
      AND EXISTS (SELECT 1 FROM unnest(p.alternate_skus) alt WHERE alt ILIKE '%' || clean_query || '%')
      AND p.id NOT IN (SELECT es.id FROM exact_sku es)
      AND p.id NOT IN (SELECT ea.id FROM exact_alt ea)
      AND p.id NOT IN (SELECT ps.id FROM partial_sku ps)
      AND (category_filter IS NULL OR p.category = category_filter)
      AND (brand_filter IS NULL OR p.brand = brand_filter)
      AND (NOT in_stock_only OR p.in_stock = true)
  ),
  -- Tier 5: full-text (only when ft_query has actual words)
  fulltext AS (
    SELECT p.id, p.external_id, p.sku, p.name, p.description,
           p.category, p.brand, p.price, p.primary_image_url,
           p.in_stock,
           ts_rank(p.search_vector, websearch_to_tsquery('english', ft_query)) * 0.8 as relevance
    FROM products p
    WHERE length(ft_query) > 1
      AND p.search_vector @@ websearch_to_tsquery('english', ft_query)
      AND p.id NOT IN (SELECT es.id FROM exact_sku es)
      AND p.id NOT IN (SELECT ea.id FROM exact_alt ea)
      AND p.id NOT IN (SELECT ps.id FROM partial_sku ps)
      AND p.id NOT IN (SELECT pa.id FROM partial_alt pa)
      AND (category_filter IS NULL OR p.category = category_filter)
      AND (brand_filter IS NULL OR p.brand = brand_filter)
      AND (NOT in_stock_only OR p.in_stock = true)
  ),
  -- Tier 6: fuzzy name/brand/description contains
  fuzzy AS (
    SELECT p.id, p.external_id, p.sku, p.name, p.description,
           p.category, p.brand, p.price, p.primary_image_url,
           p.in_stock, 0.3::FLOAT
    FROM products p
    WHERE (
      p.name ILIKE '%' || clean_query || '%'
      OR (p.brand IS NOT NULL AND p.brand ILIKE '%' || clean_query || '%')
      OR (p.description IS NOT NULL AND p.description ILIKE '%' || clean_query || '%')
    )
      AND p.id NOT IN (SELECT es.id FROM exact_sku es)
      AND p.id NOT IN (SELECT ea.id FROM exact_alt ea)
      AND p.id NOT IN (SELECT ps.id FROM partial_sku ps)
      AND p.id NOT IN (SELECT pa.id FROM partial_alt pa)
      AND p.id NOT IN (SELECT ft.id FROM fulltext ft)
      AND (category_filter IS NULL OR p.category = category_filter)
      AND (brand_filter IS NULL OR p.brand = brand_filter)
      AND (NOT in_stock_only OR p.in_stock = true)
  )
  SELECT r.id, r.external_id, r.sku, r.name, r.description,
         r.category, r.brand, r.price, r.primary_image_url,
         r.in_stock, r.relevance
  FROM (
    SELECT * FROM exact_sku
    UNION ALL SELECT * FROM exact_alt
    UNION ALL SELECT * FROM partial_sku
    UNION ALL SELECT * FROM partial_alt
    UNION ALL SELECT * FROM fulltext
    UNION ALL SELECT * FROM fuzzy
  ) r
  ORDER BY (CASE WHEN r.in_stock THEN r.relevance ELSE r.relevance * 0.5 END) DESC, r.name ASC
  LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;
