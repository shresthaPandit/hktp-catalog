#!/usr/bin/env bash
# Run this FIRST before any import attempt.
# Usage: ./scripts/import/detect-charset.sh /path/to/hktrailer_products_only.sql
#
# What it does:
#   1. Detects charset encoding of the SQL file
#   2. Checks for latin1/utf8mb4 markers
#   3. Samples image filenames from tbl_product_image
#   4. Samples the products schema to confirm column names
#
# Findings from schema analysis (hktrailer_products_only.sql):
#   - File-level charset: utf8mb4 (SET NAMES utf8mb4 in header)
#   - tbl_product.sku column: CHARACTER SET latin1 (mixed charset)
#   - Image URLs: stored as filenames only (e.g. "1722817644.jpeg")
#     NOT full URLs — base URL from hkmis.ca must be confirmed with client
#   - No direct brand FK in tbl_product; brand comes via tbl_brand + purchase orders
#   - Alternate SKUs are in tbl_product_cross_ref.cross_ref (text, e.g. "(MERITOR) M807014")

set -e

SQL_FILE="${1:-hktrailer_products_only.sql}"

if [ ! -f "$SQL_FILE" ]; then
  echo "ERROR: File not found: $SQL_FILE"
  echo "Usage: $0 /path/to/hktrailer_products_only.sql"
  exit 1
fi

echo "=== Charset Detection ==="
file "$SQL_FILE"
echo ""

# Check for charset declarations in the file header
echo "--- Charset markers found in SQL header (first 20 lines) ---"
head -20 "$SQL_FILE" | grep -i "charset\|names\|collat" || echo "(none found in first 20 lines)"
echo ""

# Check for latin1/cp1252 markers
if grep -qi "SET NAMES utf8mb4" "$SQL_FILE"; then
  echo "INFO: File uses utf8mb4 encoding (SET NAMES utf8mb4 found)."
  echo "      Standard iconv conversion is NOT needed."
  echo "      However, tbl_product.sku column is latin1 — pgloader will handle coercion."
elif grep -qi "latin1\|charset=latin\|cp1252\|SET NAMES latin" "$SQL_FILE"; then
  echo "WARNING: latin1/cp1252 encoding detected in SQL file headers."
  echo "Run the following to convert before importing:"
  echo ""
  echo "  iconv -f latin1 -t utf-8 \"$SQL_FILE\" > hktrailer_utf8.sql"
  echo ""
  echo "Then use hktrailer_utf8.sql as your import source."
else
  echo "No encoding markers detected. Run: file \"$SQL_FILE\" for manual inspection."
fi

echo ""
echo "=== Schema: tbl_product columns ==="
awk '/CREATE TABLE `tbl_product`/,/^) ENGINE/' "$SQL_FILE" | head -40
echo ""

echo "=== Schema: tbl_product_image columns ==="
awk '/CREATE TABLE `tbl_product_image`/,/^) ENGINE/' "$SQL_FILE" | head -15
echo ""

echo "=== Schema: tbl_product_cross_ref columns ==="
awk '/CREATE TABLE `tbl_product_cross_ref`/,/^) ENGINE/' "$SQL_FILE" | head -15
echo ""

echo "=== Image filename sample (first 5 from tbl_product_image) ==="
# Images are stored as filenames only, NOT full URLs.
# The base URL must be confirmed with client (expected: https://hkmis.ca/uploads/products/ or similar)
grep -oP "(?<=INSERT INTO \`tbl_product_image\`[^(]+VALUES\n?\()[^)]*" "$SQL_FILE" | head -5 || \
grep -A1 "Dumping data for table \`tbl_product_image\`" "$SQL_FILE" | \
  grep -oP "'[^']*\.(jpg|jpeg|png|gif|webp)'" | head -5 || \
  echo "Run manually: grep -oP \"'[^']*\\.(jpg|jpeg|png)' \" after the tbl_product_image INSERT block"

echo ""
echo "ACTION REQUIRED: Confirm image base URL with client."
echo "  Ask: What is the base URL for product images on hkmis.ca?"
echo "  Expected pattern: https://hkmis.ca/uploads/products/{filename}"
echo "  Or check the live site source for a product image URL."
echo ""

echo "=== Cross-reference (alternate SKU) sample (first 5) ==="
grep "INSERT INTO \`tbl_product_cross_ref\`" "$SQL_FILE" | head -1 | \
  grep -oP "'[A-Z0-9(). -]+'" | head -10 || \
  echo "Run manually: search for INSERT INTO tbl_product_cross_ref in the dump"

echo ""
echo "=== Product count estimate ==="
grep -c "^(" "$SQL_FILE" 2>/dev/null | head -1 || \
  echo "Run: grep -c '^(' hktrailer_products_only.sql to estimate row count"

echo ""
echo "=== French character check ==="
# Look for accented characters that would indicate UTF-8 content
if grep -qP "[À-ÿ]" "$SQL_FILE"; then
  echo "PASS: Accented characters found — UTF-8 content present."
else
  echo "INFO: No accented characters found in sample. May be English-only data or encoding issue."
fi

echo ""
echo "=== Summary ==="
echo "If all checks pass, proceed to:"
echo "  1. Load dump into local MySQL: mysql -u root hktrailer_db < \"$SQL_FILE\""
echo "  2. Update scripts/import/load.conf with connection details"
echo "  3. Run: pgloader scripts/import/load.conf"
echo "  4. In Supabase SQL Editor: run scripts/import/transform.sql"
echo "  5. Run scripts/import/seed-verify.sql to confirm import quality"
