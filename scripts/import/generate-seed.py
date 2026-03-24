#!/usr/bin/env python3
"""
HK Trailer Parts — MySQL Dump → Supabase products seed SQL
Usage:  python scripts/import/generate-seed.py
Output: client_data/products-seed.sql  (run in Supabase SQL Editor)

Image base URL confirmed: https://hkmis.ca/web/product-images/
"""

import re, json, sys, os
from datetime import datetime

SQL_FILE    = 'client_data/hktrailer_products_only/hktrailer_products_only.sql'
OUTPUT_FILE = 'client_data/products-seed.sql'
IMAGE_BASE  = 'https://hkmis.ca/web/product-images/'
BATCH_SIZE  = 200   # rows per INSERT statement

# ── Parser ────────────────────────────────────────────────────────────────────

def parse_value(s, i):
    """Parse one MySQL value starting at position i. Returns (value, new_i)."""
    n = len(s)
    # skip leading whitespace
    while i < n and s[i] in ' \t\n\r':
        i += 1
    if i >= n:
        return None, i
    if s[i:i+4] == 'NULL':
        return None, i + 4
    if s[i] == "'":
        i += 1
        buf = []
        while i < n:
            c = s[i]
            if c == '\\' and i + 1 < n:
                esc = s[i+1]
                buf.append({'n':'\n','r':'\r','t':'\t',"'":"'",'"':'"','\\':'\\'}.get(esc, esc))
                i += 2
            elif c == "'" and i + 1 < n and s[i+1] == "'":
                buf.append("'"); i += 2
            elif c == "'":
                i += 1; break
            else:
                buf.append(c); i += 1
        return ''.join(buf), i
    # number / bare word
    j = i
    while j < n and s[j] not in ',)':
        j += 1
    return s[i:j].strip(), j


def parse_row(s, i):
    """Parse one (v1, v2, ...) row. Returns (list, new_i)."""
    n = len(s)
    while i < n and s[i] != '(':
        i += 1
    if i >= n:
        return None, i
    i += 1  # skip '('
    row = []
    while i < n:
        while i < n and s[i] in ' \t\n\r':
            i += 1
        if i < n and s[i] == ')':
            i += 1; break
        val, i = parse_value(s, i)
        row.append(val)
        while i < n and s[i] in ' \t\n\r':
            i += 1
        if i < n and s[i] == ',':
            i += 1
    return row, i


def extract_table(content, table):
    """Return list of dicts for all INSERT rows of `table`."""
    col_pattern = re.compile(
        rf"INSERT INTO `{re.escape(table)}` \(([^)]+)\) VALUES\s*", re.IGNORECASE
    )
    rows_all = []
    for m in col_pattern.finditer(content):
        cols = [c.strip().strip('`') for c in m.group(1).split(',')]
        body_start = m.end()
        # collect rows until semicolon
        i = body_start
        n = len(content)
        while i < n:
            while i < n and content[i] in ' \t\n\r':
                i += 1
            if i >= n or content[i] == ';':
                break
            row, i = parse_row(content, i)
            if row is None:
                break
            if len(row) == len(cols):
                rows_all.append(dict(zip(cols, row)))
            # skip comma between rows
            while i < n and content[i] in ' \t\n\r,':
                i += 1
    return rows_all


# ── Helpers ───────────────────────────────────────────────────────────────────

def pg_str(v):
    """Escape a string for PostgreSQL dollar-quoted INSERT."""
    if v is None:
        return 'NULL'
    return "'" + v.replace("'", "''") + "'"

def pg_decimal(v):
    if v is None:
        return 'NULL'
    try:
        float(v)
        return str(v)
    except (ValueError, TypeError):
        return 'NULL'

def pg_bool(v):
    return 'TRUE' if v else 'FALSE'

def pg_array_text(lst):
    if not lst:
        return 'NULL'
    escaped = [item.replace('"', '\\"') for item in lst]
    return "ARRAY[" + ",".join(f"'{e}'" for e in escaped) + "]::TEXT[]"

def pg_jsonb(d):
    if not d:
        return "'{}'::JSONB"
    return "'" + json.dumps(d, ensure_ascii=False).replace("'", "''") + "'::JSONB"

def pg_ts(v):
    if not v or not re.match(r'^\d{4}-\d{2}-\d{2}', str(v)):
        return 'NOW()'
    return f"'{v}'::TIMESTAMP"


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    if not os.path.exists(SQL_FILE):
        print(f"ERROR: {SQL_FILE} not found. Run from project root.", file=sys.stderr)
        sys.exit(1)

    print("Reading SQL dump (this takes ~10s for large files)…")
    with open(SQL_FILE, encoding='latin-1') as f:
        content = f.read()

    print("Parsing categories…")
    categories = {r['id']: r for r in extract_table(content, 'tbl_product_category')}

    print("Parsing assigned categories…")
    assigned = {}
    for r in extract_table(content, 'tbl_product_assigned_category'):
        pid = r.get('fk_product_id')
        cid = r.get('fk_category_id')
        if pid and cid:
            assigned.setdefault(pid, []).append(cid)

    print("Parsing images…")
    images = {}
    for r in extract_table(content, 'tbl_product_image'):
        pid = r.get('fk_product_id')
        url = (r.get('url') or '').strip()
        if pid and url:
            images.setdefault(pid, []).append(r)

    print("Parsing cross-refs (alternate SKUs)…")
    xrefs = {}
    for r in extract_table(content, 'tbl_product_cross_ref'):
        pid = r.get('fk_product_id')
        val = (r.get('cross_ref') or '').strip()
        junk = {'item 1','item 2','item 3','dfddf','dfdffd','fddffd','fdfddf','fddff',''}
        if pid and val and val not in junk:
            xrefs.setdefault(pid, set()).add(val)

    print("Parsing products…")
    products = extract_table(content, 'tbl_product')

    # Filter: active + show on website
    active = [
        p for p in products
        if str(p.get('status','')).strip() == '1'
        and str(p.get('show_on_website','')).strip() == '1'
    ]
    print(f"Active products (status=1, show_on_website=1): {len(active)}")

    # ── Build category helpers ──
    def resolve_category(product_id):
        cat_ids = assigned.get(str(product_id), assigned.get(product_id, []))
        if not cat_ids:
            return None, None
        cid = cat_ids[0]
        cat = categories.get(str(cid), categories.get(cid))
        if not cat:
            return None, None
        parent_id = cat.get('parent_id')
        if parent_id:
            parent = categories.get(str(parent_id), categories.get(parent_id))
            return (parent['title'] if parent else None), cat['title']
        return cat['title'], None

    def resolve_images(product_id):
        imgs = images.get(str(product_id), images.get(product_id, []))
        # sort: cover first, then by id
        sorted_imgs = sorted(imgs, key=lambda r: (-int(r.get('is_cover') or 0), int(r.get('id') or 0)))
        urls = [IMAGE_BASE + r['url'] for r in sorted_imgs if (r.get('url') or '').strip()]
        primary = urls[0] if urls else None
        return urls, primary

    # ── Write SQL ──
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    total_written = 0

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as out:
        out.write(f"-- HK Trailer Parts — Products seed\n")
        out.write(f"-- Generated: {datetime.utcnow().isoformat()}Z\n")
        out.write(f"-- Source: {SQL_FILE}\n")
        out.write(f"-- Active products: {len(active)}\n")
        out.write(f"-- Image base URL: {IMAGE_BASE}\n\n")
        out.write("BEGIN;\n\n")

        cols = (
            "external_id, sku, name, description, category, subcategory, "
            "price, image_urls, primary_image_url, specifications, "
            "related_parts, in_stock, last_sync_at, created_at, updated_at"
        )

        for batch_start in range(0, len(active), BATCH_SIZE):
            batch = active[batch_start:batch_start + BATCH_SIZE]
            out.write(f"INSERT INTO products ({cols}) VALUES\n")

            for idx, p in enumerate(batch):
                pid = p.get('id', '')

                # SKU
                sku_raw = (p.get('sku') or '').strip() or (p.get('internal_sku') or '').strip() or f"EXT-{pid}"

                # Name: website_description > description > name
                name_val = (
                    (p.get('website_description') or '').strip()
                    or (p.get('description') or '').strip()
                    or (p.get('name') or '').strip()
                    or sku_raw
                )

                # Description (secondary)
                desc_val = (p.get('description') or '').strip() or None

                # Category
                category, subcategory = resolve_category(pid)

                # Price
                price = pg_decimal(p.get('default_price') or p.get('cost_price'))

                # Images
                img_urls, primary_img = resolve_images(pid)
                img_arr = pg_array_text(img_urls)
                pri_img = pg_str(primary_img)

                # Specifications JSONB
                specs = {}
                if (p.get('internal_sku') or '').strip():
                    specs['internal_sku'] = p['internal_sku'].strip()
                try:
                    qty = int(p.get('quantity_in_stock') or 0)
                    specs['quantity_in_stock'] = qty
                except (ValueError, TypeError):
                    pass
                alt = sorted(xrefs.get(str(pid), xrefs.get(pid, set())))
                if alt:
                    specs['alternate_skus'] = alt

                # In stock
                try:
                    in_stock = int(p.get('quantity_in_stock') or 0) > 0
                except (ValueError, TypeError):
                    in_stock = False

                comma = '' if idx == len(batch) - 1 else ','
                out.write(
                    f"  ({pg_str(str(pid))}, {pg_str(sku_raw)}, {pg_str(name_val)}, "
                    f"{pg_str(desc_val)}, {pg_str(category)}, {pg_str(subcategory)}, "
                    f"{price}, {img_arr}, {pri_img}, {pg_jsonb(specs)}, "
                    f"ARRAY[]::INTEGER[], {pg_bool(in_stock)}, NOW(), "
                    f"{pg_ts(p.get('crt_time'))}, {pg_ts(p.get('mod_time'))}){comma}\n"
                )
                total_written += 1

            out.write("ON CONFLICT (external_id) DO UPDATE SET\n")
            out.write("  sku               = EXCLUDED.sku,\n")
            out.write("  name              = EXCLUDED.name,\n")
            out.write("  description       = EXCLUDED.description,\n")
            out.write("  category          = EXCLUDED.category,\n")
            out.write("  subcategory       = EXCLUDED.subcategory,\n")
            out.write("  price             = EXCLUDED.price,\n")
            out.write("  image_urls        = EXCLUDED.image_urls,\n")
            out.write("  primary_image_url = EXCLUDED.primary_image_url,\n")
            out.write("  specifications    = EXCLUDED.specifications,\n")
            out.write("  in_stock          = EXCLUDED.in_stock,\n")
            out.write("  last_sync_at      = NOW(),\n")
            out.write("  updated_at        = NOW();\n\n")

            pct = min(100, int((batch_start + len(batch)) / len(active) * 100))
            print(f"  Batch {batch_start//BATCH_SIZE + 1}: {pct}% ({batch_start + len(batch)}/{len(active)})")

        out.write("COMMIT;\n\n")
        out.write(f"-- Verify: SELECT COUNT(*) FROM products;\n")
        out.write(f"-- Expected: {total_written}\n")

    size_mb = os.path.getsize(OUTPUT_FILE) / 1024 / 1024
    print(f"\nDone! Wrote {total_written} products to {OUTPUT_FILE} ({size_mb:.1f} MB)")
    print("\nNext steps:")
    print("  1. Open Supabase SQL Editor")
    print("  2. Paste and run products-seed.sql")
    print("     (if file is large, split at each COMMIT; boundary and run in parts)")
    print("  3. Run: SELECT COUNT(*) FROM products;")
    print(f"     Expected: {total_written}")


if __name__ == '__main__':
    main()
