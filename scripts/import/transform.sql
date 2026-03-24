-- HK Trailer Parts -- Post-Import Transformation
-- Run this in Supabase SQL Editor AFTER pgloader has populated the staging tables.
--
-- Staging tables created by load.conf:
--   staging_product               (from tbl_product)
--   staging_product_image         (from tbl_product_image)
--   staging_product_cross_ref     (from tbl_product_cross_ref)
--   staging_product_category      (from tbl_product_category)
--   staging_product_assigned_category (from tbl_product_assigned_category)
--   staging_brand                 (from tbl_brand)
--
-- ACTUAL COLUMN NAMES (confirmed from SQL dump schema):
--
--   staging_product:
--     id, name, description, website_description,
--     fk_category_id, sku, internal_sku,
--     quantity_in_stock, cost_price, default_price,
--     show_on_website, status, crt_time, mod_time
--     NOTE: No direct brand FK in tbl_product.
--     NOTE: 'name' column stores the SKU/part-number (e.g. "47122"), description is the actual name.
--           Verify with: SELECT name, description FROM staging_product LIMIT 20;
--
--   staging_product_image:
--     id, url (filename only, NOT full URL), is_cover,
--     fk_product_id, status, crt_time, mod_time
--     NOTE: url is a filename like "1722817644.jpeg" — NOT a full URL.
--     IMAGE BASE URL MUST BE CONFIRMED WITH CLIENT before import.
--     Ask client: "What is the base URL for product images on hkmis.ca?"
--     Expected: https://hkmis.ca/uploads/products/{url}  (UNCONFIRMED)
--
--   staging_product_cross_ref:
--     id, fk_product_id, cross_ref (text, e.g. "(MERITOR) M807014"),
--     fk_cross_ref_id, status, crt_time, mod_time
--     This is the alternate/OEM part number data (populates alternate_skus[]).
--
--   staging_product_category:
--     id, title, description, parent_id (NULL = top-level), image_url,
--     show_on_website, status, crt_time, mod_time
--
--   staging_brand:
--     id, title, description, image_url, show_on_website, status

-- ============================================================
-- STEP 0: Inspect staging tables before running transform
-- ============================================================

-- 0a. Confirm staging tables exist
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name LIKE 'staging_%';

-- 0b. Sample products to confirm name/description field semantics
-- In this dump: `name` = part number label, `description` = product description
-- SELECT id, name, description, website_description, sku, internal_sku,
--        quantity_in_stock, default_price, show_on_website, status
-- FROM staging_product LIMIT 10;

-- 0c. Confirm image URL pattern (filename only -- base URL needed from client)
-- SELECT url, is_cover, fk_product_id FROM staging_product_image LIMIT 10;

-- 0d. Confirm cross_ref data (alternate/OEM part numbers)
-- SELECT fk_product_id, cross_ref FROM staging_product_cross_ref
-- WHERE cross_ref != '' AND cross_ref IS NOT NULL LIMIT 20;

-- 0e. Sample categories with hierarchy
-- SELECT c.id, c.title, p.title as parent_title
-- FROM staging_product_category c
-- LEFT JOIN staging_product_category p ON p.id = c.parent_id
-- ORDER BY p.title NULLS FIRST, c.title LIMIT 30;

-- 0f. Confirm brand data
-- SELECT id, title FROM staging_brand WHERE status = 1 ORDER BY title LIMIT 20;

-- ============================================================
-- STEP 1: Set the image base URL
-- ACTION REQUIRED: Replace the URL below after confirming with client.
-- ============================================================

-- Set image base URL as a Postgres variable for this session.
-- Replace with actual confirmed URL before running.
SET LOCAL app.image_base_url = 'https://hkmis.ca/uploads/products/';
-- Common alternatives to check with client:
--   https://hkmis.ca/assets/products/
--   https://hkmis.ca/product-images/
--   https://hkmis.ca/images/products/
--
-- Verify one URL manually before bulk import:
--   curl -I "https://hkmis.ca/uploads/products/1722817644.jpeg"
-- Should return HTTP 200.

-- ============================================================
-- STEP 2: Build category lookup CTE (resolve parent -> subcategory)
-- ============================================================

-- ============================================================
-- STEP 3: Main INSERT...SELECT transformation
-- ============================================================
INSERT INTO products (
  external_id,
  sku,
  name,
  description,
  category,
  subcategory,
  brand,
  price,
  image_urls,
  primary_image_url,
  specifications,
  related_parts,
  alternate_skus,
  in_stock,
  last_sync_at,
  created_at,
  updated_at
)
SELECT
  -- external_id: use MySQL primary key as stable external identifier
  p.id::TEXT AS external_id,

  -- sku: use the sku column; fall back to internal_sku if sku is NULL or '123456' (test data)
  -- NOTE: Many test products have sku = '123456' -- these should be reviewed.
  -- Products with status=1 (active) and show_on_website=1 are the real catalog.
  COALESCE(
    NULLIF(TRIM(p.sku), ''),
    NULLIF(TRIM(p.internal_sku), ''),
    'EXT-' || p.id::TEXT
  ) AS sku,

  -- name: In the dump, `description` holds the human-readable product name
  -- (e.g. "CLEARANCE/MARKED - LED (GROTE)"), while `name` holds the part number label.
  -- Use website_description if available (cleaner for web display), else description.
  -- If both are empty, fall back to `name` (the part number label).
  COALESCE(
    NULLIF(TRIM(p.website_description), ''),
    NULLIF(TRIM(p.description), ''),
    TRIM(p.name)
  ) AS name,

  -- description: secondary detail text (internal description when website_description is primary)
  NULLIF(TRIM(p.description), '') AS description,

  -- category: resolve via staging_product_assigned_category -> staging_product_category
  -- Use the top-level (parent_id IS NULL) category title
  (
    SELECT COALESCE(parent_cat.title, cat.title)
    FROM staging_product_assigned_category pac
    JOIN staging_product_category cat ON cat.id = pac.fk_category_id
    LEFT JOIN staging_product_category parent_cat
           ON parent_cat.id = cat.parent_id
    WHERE pac.fk_product_id = p.id
      AND pac.status = 1
    ORDER BY pac.id
    LIMIT 1
  ) AS category,

  -- subcategory: use the child category (when category has a parent)
  (
    SELECT CASE
      WHEN cat.parent_id IS NOT NULL THEN cat.title
      ELSE NULL
    END
    FROM staging_product_assigned_category pac
    JOIN staging_product_category cat ON cat.id = pac.fk_category_id
    WHERE pac.fk_product_id = p.id
      AND pac.status = 1
      AND cat.parent_id IS NOT NULL
    ORDER BY pac.id
    LIMIT 1
  ) AS subcategory,

  -- brand: tbl_product has no direct brand FK.
  -- Brand is managed in tbl_brand separately (via purchase orders/vendor invoices).
  -- For initial import, brand is NULL. The sync workflow will populate it via PHP API.
  -- To manually assign brands after import, use the seed-verify.sql brand audit query.
  NULL AS brand,

  -- price: use default_price; fall back to cost_price + tier_1_markup calculation
  -- Both columns may be NULL for many products (prices managed separately).
  CASE
    WHEN p.default_price ~ '^[0-9]+(\.[0-9]+)?$' THEN p.default_price::DECIMAL
    WHEN p.cost_price ~ '^[0-9]+(\.[0-9]+)?$'
      AND p.tier_1_markup ~ '^[0-9]+(\.[0-9]+)?$'
      THEN (p.cost_price::DECIMAL * (1 + p.tier_1_markup::DECIMAL / 100))
    ELSE NULL
  END AS price,

  -- image_urls: aggregate all active images for this product as TEXT[]
  -- Images are stored as filenames; prepend base URL.
  (
    SELECT ARRAY_AGG(current_setting('app.image_base_url') || img.url ORDER BY img.is_cover DESC, img.id)
    FROM staging_product_image img
    WHERE img.fk_product_id = p.id
      AND img.status = 1
      AND img.url IS NOT NULL
      AND TRIM(img.url) != ''
  ) AS image_urls,

  -- primary_image_url: the cover image (is_cover = 1), else first active image
  (
    SELECT current_setting('app.image_base_url') || img.url
    FROM staging_product_image img
    WHERE img.fk_product_id = p.id
      AND img.status = 1
      AND img.url IS NOT NULL
      AND TRIM(img.url) != ''
    ORDER BY img.is_cover DESC, img.id
    LIMIT 1
  ) AS primary_image_url,

  -- specifications: pack tier pricing into JSONB for reference
  -- (actual selling price is managed by admin, not exposed to customers)
  jsonb_strip_nulls(jsonb_build_object(
    'internal_sku', NULLIF(TRIM(p.internal_sku), ''),
    'quantity_in_stock', CASE WHEN p.quantity_in_stock ~ '^-?[0-9]+$' THEN p.quantity_in_stock::INTEGER ELSE NULL END,
    'cost_price', CASE WHEN p.cost_price ~ '^[0-9]+(\.[0-9]+)?$' THEN p.cost_price::DECIMAL ELSE NULL END,
    'tier_1_markup', CASE WHEN p.tier_1_markup ~ '^[0-9]+(\.[0-9]+)?$' THEN p.tier_1_markup::DECIMAL ELSE NULL END
  )) AS specifications,

  -- related_parts: populated later by sync workflow (not in initial import)
  ARRAY[]::INTEGER[] AS related_parts,

  -- alternate_skus: aggregate cross_ref values from tbl_product_cross_ref
  -- Only include non-empty, non-placeholder values (status=1 active, cross_ref not empty)
  (
    SELECT ARRAY_AGG(DISTINCT TRIM(xr.cross_ref) ORDER BY TRIM(xr.cross_ref))
    FROM staging_product_cross_ref xr
    WHERE xr.fk_product_id = p.id
      AND xr.status = 1
      AND TRIM(xr.cross_ref) != ''
      AND xr.cross_ref IS NOT NULL
      -- Exclude obvious test/placeholder data
      AND TRIM(xr.cross_ref) NOT IN ('item 1', 'item 2', 'item 3', 'dfddf', 'dfdffd', 'fddffd', 'fdfddf', 'fddff')
  ) AS alternate_skus,

  -- in_stock: based on quantity_in_stock > 0 OR status = 1 (active)
  -- status 1 = active, 0 = inactive, 2 = blocked
  -- show_on_website 1 = yes, 2 = no
  (
    CASE
      WHEN p.quantity_in_stock ~ '^[0-9]+$'
        AND p.quantity_in_stock::INTEGER > 0 THEN true
      ELSE false
    END
  ) AS in_stock,

  -- last_sync_at: mark with import timestamp
  NOW() AS last_sync_at,

  COALESCE(
    CASE WHEN p.crt_time ~ '^\d{4}-\d{2}-\d{2}' THEN p.crt_time::TIMESTAMP ELSE NULL END,
    NOW()
  ) AS created_at,

  COALESCE(
    CASE WHEN p.mod_time ~ '^\d{4}-\d{2}-\d{2}' THEN p.mod_time::TIMESTAMP ELSE NULL END,
    NOW()
  ) AS updated_at

FROM staging_product p

-- Only import products that are active and visible on website
WHERE p.status::INTEGER = 1
  AND p.show_on_website::INTEGER = 1

-- Upsert on external_id to allow safe re-running
ON CONFLICT (external_id) DO UPDATE SET
  sku                = EXCLUDED.sku,
  name               = EXCLUDED.name,
  description        = EXCLUDED.description,
  category           = EXCLUDED.category,
  subcategory        = EXCLUDED.subcategory,
  brand              = EXCLUDED.brand,
  price              = EXCLUDED.price,
  image_urls         = EXCLUDED.image_urls,
  primary_image_url  = EXCLUDED.primary_image_url,
  specifications     = EXCLUDED.specifications,
  alternate_skus     = EXCLUDED.alternate_skus,
  in_stock           = EXCLUDED.in_stock,
  last_sync_at       = NOW(),
  updated_at         = NOW();

-- ============================================================
-- STEP 4: Backfill search_vector (in case trigger did not fire)
-- ============================================================
-- The search_vector trigger should fire automatically on INSERT.
-- Run this only if Query 2 in seed-verify.sql returns > 0.

-- UPDATE products
-- SET search_vector = to_tsvector('english',
--   COALESCE(name, '') || ' ' ||
--   COALESCE(description, '') || ' ' ||
--   COALESCE(sku, '') || ' ' ||
--   COALESCE(category, '') || ' ' ||
--   COALESCE(brand, '') || ' ' ||
--   COALESCE(array_to_string(alternate_skus, ' '), '')
-- )
-- WHERE search_vector IS NULL;

-- ============================================================
-- STEP 5: Verify row count and quality
-- Run seed-verify.sql after this script completes.
-- ============================================================

-- ============================================================
-- STEP 6: Drop staging tables after verification
-- Only run after seed-verify.sql confirms all checks pass.
-- ============================================================

-- DROP TABLE IF EXISTS staging_product;
-- DROP TABLE IF EXISTS staging_product_image;
-- DROP TABLE IF EXISTS staging_product_cross_ref;
-- DROP TABLE IF EXISTS staging_product_category;
-- DROP TABLE IF EXISTS staging_product_assigned_category;
-- DROP TABLE IF EXISTS staging_brand;

-- ============================================================
-- IMPORT NOTES
-- ============================================================
-- 1. BRAND: tbl_product has no direct brand FK. Brand is managed via
--    tbl_brand but linked through vendor/purchase order relationships.
--    The PHP sync API should provide brand data per product.
--    After confirming the PHP API contract, update the brand column via:
--      UPDATE products SET brand = <api_brand_value>
--      WHERE external_id = <product_id>;
--
-- 2. NAME vs DESCRIPTION: In the dump, `name` = internal part number label
--    (e.g. "47122"), `description` = human-readable name ("CLEARANCE MARKER LED").
--    website_description = clean web-facing version.
--    The transform uses website_description > description > name.
--    Review: SELECT sku, name, description FROM products LIMIT 20;
--
-- 3. IMAGE BASE URL: Set in STEP 1. Must be confirmed with client.
--    Test manually: curl -I "{base_url}{sample_filename}"
--
-- 4. SKU CONFLICTS: Some test products use sku='123456'. If ON CONFLICT
--    on sku fails, it means the products table has a UNIQUE constraint on sku.
--    Fix: ensure WHERE status=1 AND show_on_website=1 filters them out,
--    or temporarily disable the sku unique constraint during import.
