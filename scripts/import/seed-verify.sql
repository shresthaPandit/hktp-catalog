-- HK Trailer Parts -- Seed Verification Queries
-- Run these in Supabase SQL Editor after transform.sql completes.
-- Each query should return the expected result. Review any FAILs before proceeding.
--
-- Schema reference (actual columns from hktrailer_products_only.sql):
--   tbl_product: id, name (part label), description (product name), website_description,
--                fk_category_id, sku, internal_sku, quantity_in_stock,
--                cost_price, default_price, tier_1_markup, show_on_website, status
--   tbl_product_image: id, url (filename only), is_cover, fk_product_id, status
--   tbl_product_cross_ref: id, fk_product_id, cross_ref (OEM number text), status
--   tbl_product_category: id, title, parent_id (hierarchy), status

-- ============================================================
-- SECTION 1: Basic import completeness
-- ============================================================

-- 1. Total product count
-- Expected: between 1,000 and 5,000 (dump has ~3,400 active show_on_website products)
-- (Full 15,000 figure may come from PHP API sync — dump may have fewer)
SELECT COUNT(*) AS total_products FROM products;

-- 2. Search vector coverage -- expect 0 (trigger populates on INSERT)
SELECT COUNT(*) AS products_missing_search_vector
FROM products WHERE search_vector IS NULL;

-- 3. SKU coverage -- expect 0 NULLs (SKU is NOT NULL in schema)
SELECT COUNT(*) AS products_missing_sku
FROM products WHERE sku IS NULL OR sku = '';

-- 4. External ID coverage -- expect 0 NULLs
SELECT COUNT(*) AS products_missing_external_id
FROM products WHERE external_id IS NULL OR external_id = '';

-- ============================================================
-- SECTION 2: Data quality checks
-- ============================================================

-- 5. French character sanity check
-- Expected: rows with proper accented characters like e, a, c (if any French products)
-- If this returns 0, French characters may not be present in this dump
SELECT name FROM products WHERE name ~ '[À-ÿ]' LIMIT 10;

-- 6. Name/description populated
SELECT
  COUNT(*) FILTER (WHERE name IS NOT NULL AND name != '') AS with_name,
  COUNT(*) FILTER (WHERE name IS NULL OR name = '') AS without_name,
  COUNT(*) FILTER (WHERE description IS NOT NULL) AS with_description
FROM products;

-- 7. In-stock distribution
SELECT in_stock, COUNT(*) AS product_count
FROM products GROUP BY in_stock;

-- ============================================================
-- SECTION 3: Image URL verification
-- ============================================================

-- 8. Image URL coverage
SELECT
  COUNT(*) AS total_products,
  COUNT(*) FILTER (WHERE primary_image_url IS NOT NULL) AS with_primary_image,
  COUNT(*) FILTER (WHERE image_urls IS NOT NULL AND array_length(image_urls, 1) > 0) AS with_any_image,
  COUNT(*) FILTER (WHERE primary_image_url IS NULL) AS without_image
FROM products;

-- 9. Sample 5 image URLs -- manually test each in browser / curl
-- Each should return HTTP 200. If 404, the base URL in transform.sql needs correction.
-- Test: curl -I "<url>"
SELECT primary_image_url
FROM products
WHERE primary_image_url IS NOT NULL
LIMIT 5;

-- 10. Detect potential wrong base URL
-- All image URLs should start with the same base domain.
-- If you see mixed patterns or filenames without a domain, base URL was not set.
SELECT DISTINCT
  CASE
    WHEN primary_image_url LIKE 'http%' THEN split_part(primary_image_url, '/', 3)
    ELSE 'MISSING_BASE_URL: ' || LEFT(primary_image_url, 50)
  END AS url_domain,
  COUNT(*) AS product_count
FROM products
WHERE primary_image_url IS NOT NULL
GROUP BY 1
ORDER BY 2 DESC
LIMIT 10;

-- ============================================================
-- SECTION 4: Category & brand distribution
-- ============================================================

-- 11. Category distribution (top 15)
SELECT category, COUNT(*) AS product_count
FROM products
GROUP BY category ORDER BY COUNT(*) DESC
LIMIT 15;

-- 12. Subcategory distribution (top 15)
SELECT subcategory, COUNT(*) AS product_count
FROM products
WHERE subcategory IS NOT NULL
GROUP BY subcategory ORDER BY COUNT(*) DESC
LIMIT 15;

-- 13. Brand distribution
-- NOTE: Brand is NULL in initial import (no direct FK in tbl_product).
-- This should show all products with brand = NULL after initial import.
-- Brand will be populated via PHP API sync.
SELECT
  COUNT(*) FILTER (WHERE brand IS NOT NULL) AS with_brand,
  COUNT(*) FILTER (WHERE brand IS NULL) AS without_brand
FROM products;

-- ============================================================
-- SECTION 5: Price coverage
-- ============================================================

-- 14. Price coverage
SELECT
  COUNT(*) FILTER (WHERE price IS NOT NULL) AS with_price,
  COUNT(*) FILTER (WHERE price IS NULL) AS without_price,
  MIN(price) AS min_price,
  MAX(price) AS max_price,
  ROUND(AVG(price), 2) AS avg_price
FROM products;

-- ============================================================
-- SECTION 6: Alternate SKU / cross-reference coverage (CAT-04)
-- ============================================================

-- 15. Alternate SKU coverage
SELECT
  COUNT(*) AS total_products,
  COUNT(*) FILTER (WHERE alternate_skus IS NOT NULL
    AND array_length(alternate_skus, 1) > 0) AS with_alternate_skus,
  COUNT(*) FILTER (WHERE alternate_skus IS NULL
    OR array_length(alternate_skus, 1) = 0) AS without_alternate_skus
FROM products;

-- 16. Sample alternate SKUs (OEM cross references)
-- Expected format: "(MERITOR) M807014", "(HALDEX) 40110211", "TORQUE TR1140"
SELECT sku, name, alternate_skus
FROM products
WHERE alternate_skus IS NOT NULL AND array_length(alternate_skus, 1) > 0
LIMIT 10;

-- ============================================================
-- SECTION 7: Search function testing
-- ============================================================

-- 17. Test search_products() -- SKU exact match
-- Replace 'TRK-ENG-001' with an actual SKU from your data (use Query 18 first)
SELECT id, sku, name, relevance FROM search_products('TRK-ENG-001', NULL, NULL, false, 5, 0);

-- 18. Get sample SKUs to use in search tests
SELECT sku, name FROM products WHERE sku IS NOT NULL ORDER BY RANDOM() LIMIT 5;

-- 19. Test search_products() -- full-text keyword search
-- Replace 'brake' with a common term visible in your product names
SELECT name, sku, relevance FROM search_products('brake', NULL, NULL, false, 10, 0);

-- 20. Test search_products() -- partial/fuzzy match
SELECT name, sku, relevance FROM search_products('brak', NULL, NULL, false, 10, 0);

-- 21. Test search_products() -- with category filter
-- Replace 'BRAKE SYSTEM' with an actual category name from Query 11
SELECT name, sku, relevance
FROM search_products('brake', 'BRAKE SYSTEM', NULL, false, 10, 0);

-- ============================================================
-- SECTION 8: Staging table audit (run before dropping staging tables)
-- ============================================================

-- 22. Compare staging vs final product count
SELECT
  (SELECT COUNT(*) FROM staging_product WHERE status::INTEGER = 1 AND show_on_website::INTEGER = 1) AS staging_active_products,
  (SELECT COUNT(*) FROM products) AS imported_products,
  (SELECT COUNT(*) FROM staging_product WHERE status::INTEGER = 1 AND show_on_website::INTEGER = 1) -
  (SELECT COUNT(*) FROM products) AS difference;

-- 23. Products in staging NOT imported (check for duplicates or errors)
-- Should return 0 rows if import was complete
SELECT s.id, s.name, s.description, s.sku
FROM staging_product s
WHERE s.status::INTEGER = 1
  AND s.show_on_website::INTEGER = 1
  AND NOT EXISTS (
    SELECT 1 FROM products p WHERE p.external_id = s.id::TEXT
  )
LIMIT 20;

-- 24. Cross-ref data still in staging (verify alternate_skus populated)
-- Shows products that have cross_ref records but no alternate_skus in products table
SELECT p.id, p.sku, p.name, COUNT(xr.id) AS cross_ref_count
FROM staging_product_cross_ref xr
JOIN staging_product sp ON sp.id::TEXT = xr.fk_product_id::TEXT
JOIN products p ON p.external_id = sp.id::TEXT
WHERE xr.status = 1
  AND TRIM(xr.cross_ref) != ''
  AND (p.alternate_skus IS NULL OR array_length(p.alternate_skus, 1) = 0)
GROUP BY p.id, p.sku, p.name
LIMIT 20;

-- ============================================================
-- SECTION 9: Specifications JSONB audit
-- ============================================================

-- 25. Sample specifications column content
SELECT id, sku, name, specifications
FROM products
WHERE specifications != '{}'::JSONB
LIMIT 10;

-- ============================================================
-- PASS/FAIL SUMMARY CHECKLIST
-- ============================================================
-- After running all queries, verify:
-- [ ] Query 1:  total_products > 1000 (expect 1,000-5,000 from dump)
-- [ ] Query 2:  products_missing_search_vector = 0
-- [ ] Query 3:  products_missing_sku = 0
-- [ ] Query 5:  French chars correct (or confirmed English-only data)
-- [ ] Query 9:  5 image URLs manually tested -- all return HTTP 200
-- [ ] Query 10: all URLs share same domain (no MISSING_BASE_URL entries)
-- [ ] Query 14: price coverage noted (NULL prices are expected initially)
-- [ ] Query 15: alternate_skus populated where cross_ref data exists
-- [ ] Query 19: search returns relevant products for common terms
-- [ ] Query 22: difference = 0 (all active products imported)
-- If all pass, drop staging tables (Step 6 in transform.sql).
