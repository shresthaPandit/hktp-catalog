-- Migration 002: Robust search_products — tiered SKU/cross-ref/fulltext/fuzzy
-- LANGUAGE sql avoids plpgsql column-ambiguity in RETURNS TABLE + CTEs.
-- Run in Supabase SQL Editor (drop first to handle any signature change).

DROP FUNCTION IF EXISTS search_products(TEXT, TEXT, TEXT, BOOLEAN, INTEGER, INTEGER);

CREATE FUNCTION search_products(
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
) LANGUAGE sql STABLE AS $$
  WITH
  -- Normalise the raw query once
  _q AS (
    SELECT
      trim(search_query)                                                          AS q,
      trim(regexp_replace(search_query, '[^a-zA-Z0-9 ]', ' ', 'g'))             AS ft
  ),

  -- Tier 1: exact SKU match  (relevance 1.0)
  t1 AS (
    SELECT p.id, p.external_id, p.sku, p.name, p.description,
           p.category, p.brand, p.price, p.primary_image_url, p.in_stock,
           1.0::FLOAT AS relevance
    FROM products p, _q
    WHERE upper(p.sku) = upper(_q.q)
      AND p.status = 1 AND p.show_on_website = true
      AND (category_filter IS NULL OR p.category = category_filter)
      AND (brand_filter   IS NULL OR p.brand    = brand_filter)
      AND (NOT in_stock_only OR p.in_stock = true)
  ),

  -- Tier 2: exact cross-reference match  (relevance 0.95)
  t2 AS (
    SELECT p.id, p.external_id, p.sku, p.name, p.description,
           p.category, p.brand, p.price, p.primary_image_url, p.in_stock,
           0.95::FLOAT AS relevance
    FROM products p, _q
    WHERE p.alternate_skus IS NOT NULL
      AND array_length(p.alternate_skus, 1) > 0
      AND EXISTS (
            SELECT 1
            FROM unnest(p.alternate_skus) AS alt
            WHERE upper(alt) = upper(_q.q)
          )
      AND p.id NOT IN (SELECT t1.id FROM t1)
      AND p.status = 1 AND p.show_on_website = true
      AND (category_filter IS NULL OR p.category = category_filter)
      AND (brand_filter   IS NULL OR p.brand    = brand_filter)
      AND (NOT in_stock_only OR p.in_stock = true)
  ),

  -- Tier 3: partial SKU contains  (relevance 0.9)
  t3 AS (
    SELECT p.id, p.external_id, p.sku, p.name, p.description,
           p.category, p.brand, p.price, p.primary_image_url, p.in_stock,
           0.9::FLOAT AS relevance
    FROM products p, _q
    WHERE upper(p.sku) LIKE '%' || upper(_q.q) || '%'
      AND p.id NOT IN (SELECT t1.id FROM t1)
      AND p.id NOT IN (SELECT t2.id FROM t2)
      AND p.status = 1 AND p.show_on_website = true
      AND (category_filter IS NULL OR p.category = category_filter)
      AND (brand_filter   IS NULL OR p.brand    = brand_filter)
      AND (NOT in_stock_only OR p.in_stock = true)
  ),

  -- Tier 4: partial cross-reference contains  (relevance 0.85)
  t4 AS (
    SELECT p.id, p.external_id, p.sku, p.name, p.description,
           p.category, p.brand, p.price, p.primary_image_url, p.in_stock,
           0.85::FLOAT AS relevance
    FROM products p, _q
    WHERE p.alternate_skus IS NOT NULL
      AND array_length(p.alternate_skus, 1) > 0
      AND EXISTS (
            SELECT 1
            FROM unnest(p.alternate_skus) AS alt
            WHERE upper(alt) LIKE '%' || upper(_q.q) || '%'
          )
      AND p.id NOT IN (SELECT t1.id FROM t1)
      AND p.id NOT IN (SELECT t2.id FROM t2)
      AND p.id NOT IN (SELECT t3.id FROM t3)
      AND p.status = 1 AND p.show_on_website = true
      AND (category_filter IS NULL OR p.category = category_filter)
      AND (brand_filter   IS NULL OR p.brand    = brand_filter)
      AND (NOT in_stock_only OR p.in_stock = true)
  ),

  -- Tier 5: full-text search (only when ft_query produces useful tokens)
  t5 AS (
    SELECT p.id, p.external_id, p.sku, p.name, p.description,
           p.category, p.brand, p.price, p.primary_image_url, p.in_stock,
           (ts_rank(p.search_vector, websearch_to_tsquery('english', _q.ft)) * 0.8)::FLOAT AS relevance
    FROM products p, _q
    WHERE length(_q.ft) > 1
      AND p.search_vector @@ websearch_to_tsquery('english', _q.ft)
      AND p.id NOT IN (SELECT t1.id FROM t1)
      AND p.id NOT IN (SELECT t2.id FROM t2)
      AND p.id NOT IN (SELECT t3.id FROM t3)
      AND p.id NOT IN (SELECT t4.id FROM t4)
      AND p.status = 1 AND p.show_on_website = true
      AND (category_filter IS NULL OR p.category = category_filter)
      AND (brand_filter   IS NULL OR p.brand    = brand_filter)
      AND (NOT in_stock_only OR p.in_stock = true)
  ),

  -- Tier 6: fuzzy — name / brand / description contains  (relevance 0.3)
  t6 AS (
    SELECT p.id, p.external_id, p.sku, p.name, p.description,
           p.category, p.brand, p.price, p.primary_image_url, p.in_stock,
           0.3::FLOAT AS relevance
    FROM products p, _q
    WHERE (
          p.name        ILIKE '%' || _q.q || '%'
       OR p.brand       ILIKE '%' || _q.q || '%'
       OR p.description ILIKE '%' || _q.q || '%'
    )
      AND p.id NOT IN (SELECT t1.id FROM t1)
      AND p.id NOT IN (SELECT t2.id FROM t2)
      AND p.id NOT IN (SELECT t3.id FROM t3)
      AND p.id NOT IN (SELECT t4.id FROM t4)
      AND p.id NOT IN (SELECT t5.id FROM t5)
      AND p.status = 1 AND p.show_on_website = true
      AND (category_filter IS NULL OR p.category = category_filter)
      AND (brand_filter   IS NULL OR p.brand    = brand_filter)
      AND (NOT in_stock_only OR p.in_stock = true)
  )

  SELECT r.id, r.external_id, r.sku, r.name, r.description,
         r.category, r.brand, r.price, r.primary_image_url,
         r.in_stock, r.relevance
  FROM (
    SELECT * FROM t1
    UNION ALL SELECT * FROM t2
    UNION ALL SELECT * FROM t3
    UNION ALL SELECT * FROM t4
    UNION ALL SELECT * FROM t5
    UNION ALL SELECT * FROM t6
  ) r
  ORDER BY (CASE WHEN r.in_stock THEN r.relevance ELSE r.relevance * 0.5 END) DESC, r.name ASC
  LIMIT limit_count OFFSET offset_count
$$;
