#!/usr/bin/env python3
"""
HK Trailer Parts — Insert products into Supabase via REST API
Usage: python scripts/import/insert-via-api.py
"""

import re, json, sys, os, time
from urllib.request import urlopen, Request
from urllib.error import HTTPError
from urllib.parse import urlencode
from datetime import datetime

SQL_FILE   = 'client_data/hktrailer_products_only/hktrailer_products_only.sql'
IMAGE_BASE = 'https://hkmis.ca/web/product-images/'
SUPABASE_URL = 'https://uibyfzthfjhxdxyferqj.supabase.co'
SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpYnlmenRoZmpoeGR4eWZlcnFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQ1ODQzOCwiZXhwIjoyMDg5MDM0NDM4fQ.bfVy_5Jm0lZHPwNdIjj5PvCrHTis-nGNKIIIDYPyCEQ'
BATCH_SIZE = 50  # smaller batches to isolate conflicts

# ── Parser (same as generate-seed.py) ────────────────────────────────────────

def parse_value(s, i):
    n = len(s)
    while i < n and s[i] in ' \t\n\r': i += 1
    if i >= n: return None, i
    if s[i:i+4] == 'NULL': return None, i + 4
    if s[i] == "'":
        i += 1; buf = []
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
    j = i
    while j < n and s[j] not in ',)': j += 1
    return s[i:j].strip(), j

def parse_row(s, i):
    n = len(s)
    while i < n and s[i] != '(': i += 1
    if i >= n: return None, i
    i += 1; row = []
    while i < n:
        while i < n and s[i] in ' \t\n\r': i += 1
        if i < n and s[i] == ')': i += 1; break
        val, i = parse_value(s, i)
        row.append(val)
        while i < n and s[i] in ' \t\n\r': i += 1
        if i < n and s[i] == ',': i += 1
    return row, i

def extract_table(content, table):
    col_pattern = re.compile(
        rf"INSERT INTO `{re.escape(table)}` \(([^)]+)\) VALUES\s*", re.IGNORECASE)
    rows_all = []
    for m in col_pattern.finditer(content):
        cols = [c.strip().strip('`') for c in m.group(1).split(',')]
        i = m.end(); n = len(content)
        while i < n:
            while i < n and content[i] in ' \t\n\r': i += 1
            if i >= n or content[i] == ';': break
            row, i = parse_row(content, i)
            if row is None: break
            if len(row) == len(cols): rows_all.append(dict(zip(cols, row)))
            while i < n and content[i] in ' \t\n\r,': i += 1
    return rows_all

# ── Supabase upsert ───────────────────────────────────────────────────────────

def upsert_batch(rows):
    url = f"{SUPABASE_URL}/rest/v1/products"
    data = json.dumps(rows).encode('utf-8')
    req = Request(url, data=data, method='POST', headers={
        'apikey': SERVICE_KEY,
        'Authorization': f'Bearer {SERVICE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal',
    })
    try:
        with urlopen(req, timeout=60) as resp:
            return resp.status, None
    except HTTPError as e:
        body = e.read().decode()
        return e.code, body

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("Reading SQL dump…")
    with open(SQL_FILE, encoding='latin-1') as f:
        content = f.read()

    print("Parsing categories…")
    categories = {r['id']: r for r in extract_table(content, 'tbl_product_category')}

    print("Parsing assigned categories…")
    assigned = {}
    for r in extract_table(content, 'tbl_product_assigned_category'):
        pid, cid = r.get('fk_product_id'), r.get('fk_category_id')
        if pid and cid: assigned.setdefault(pid, []).append(cid)

    print("Parsing images…")
    images = {}
    for r in extract_table(content, 'tbl_product_image'):
        pid = r.get('fk_product_id'); url = (r.get('url') or '').strip()
        if pid and url: images.setdefault(pid, []).append(r)

    print("Parsing cross-refs…")
    xrefs = {}
    junk = {'item 1','item 2','item 3','dfddf','dfdffd','fddffd','fdfddf','fddff',''}
    for r in extract_table(content, 'tbl_product_cross_ref'):
        pid = r.get('fk_product_id'); val = (r.get('cross_ref') or '').strip()
        if pid and val and val not in junk: xrefs.setdefault(pid, set()).add(val)

    print("Parsing products…")
    products = extract_table(content, 'tbl_product')
    # Import ALL products — preserve original status and show_on_website
    active = products
    print(f"Total products to import: {len(active)}")

    def resolve_category(pid):
        cat_ids = assigned.get(str(pid), assigned.get(pid, []))
        if not cat_ids: return None, None
        cat = categories.get(str(cat_ids[0]), categories.get(cat_ids[0]))
        if not cat: return None, None
        parent_id = cat.get('parent_id')
        if parent_id:
            parent = categories.get(str(parent_id), categories.get(parent_id))
            return (parent['title'] if parent else None), cat['title']
        return cat['title'], None

    def resolve_images(pid):
        imgs = images.get(str(pid), images.get(pid, []))
        imgs_sorted = sorted(imgs, key=lambda r: (-int(r.get('is_cover') or 0), int(r.get('id') or 0)))
        urls = [IMAGE_BASE + r['url'] for r in imgs_sorted if (r.get('url') or '').strip()]
        return urls, (urls[0] if urls else None)

    def to_decimal(v):
        try: return float(v) if v else None
        except: return None

    def to_ts(v):
        if v and re.match(r'^\d{4}-\d{2}-\d{2}', str(v)):
            return str(v).replace(' ', 'T')
        return None

    # ── Insert in batches ──
    total_ok = 0; total_err = 0
    batch = []
    seen_skus = {}  # sku -> first pid that used it

    for i, p in enumerate(active):
        pid = p.get('id', '')
        sku_raw = (p.get('sku') or '').strip() or (p.get('internal_sku') or '').strip() or f"EXT-{pid}"
        # Deduplicate SKUs: if already seen, append product id to make unique
        if sku_raw in seen_skus:
            sku = f"{sku_raw}-{pid}"
        else:
            seen_skus[sku_raw] = pid
            sku = sku_raw
        name = ((p.get('website_description') or '').strip()
                or (p.get('description') or '').strip()
                or (p.get('name') or '').strip() or sku)
        desc = (p.get('description') or '').strip() or None
        category, subcategory = resolve_category(pid)
        img_urls, primary_img = resolve_images(pid)

        specs = {}
        if (p.get('internal_sku') or '').strip():
            specs['internal_sku'] = p['internal_sku'].strip()
        try: specs['quantity_in_stock'] = int(p.get('quantity_in_stock') or 0)
        except: pass
        alt = sorted(xrefs.get(str(pid), xrefs.get(pid, set())))
        if alt: specs['alternate_skus'] = alt

        try: in_stock = int(p.get('quantity_in_stock') or 0) > 0
        except: in_stock = False

        # Preserve original status and show_on_website from client data
        try:
            orig_status = int(p.get('status') or 1)
        except (ValueError, TypeError):
            orig_status = 1

        try:
            orig_show = int(p.get('show_on_website') or 1)
            show_on_website = (orig_show == 1)
        except (ValueError, TypeError):
            show_on_website = True

        batch.append({
            'external_id':       str(pid),
            'sku':               sku,
            'name':              name,
            'description':       desc,
            'category':          category,
            'subcategory':       subcategory,
            'price':             to_decimal(p.get('default_price') or p.get('cost_price')),
            'image_urls':        img_urls or None,
            'primary_image_url': primary_img,
            'specifications':    specs,
            'related_parts':     [],
            'in_stock':          in_stock,
            'status':            orig_status,
            'show_on_website':   show_on_website,
            'last_sync_at':      datetime.utcnow().isoformat() + 'Z',
            'created_at':        to_ts(p.get('crt_time')) or datetime.utcnow().isoformat() + 'Z',
            'updated_at':        to_ts(p.get('mod_time')) or datetime.utcnow().isoformat() + 'Z',
        })

        if len(batch) >= BATCH_SIZE or i == len(active) - 1:
            status, err = upsert_batch(batch)
            if status in (200, 201):
                total_ok += len(batch)
                pct = int((i + 1) / len(active) * 100)
                print(f"  [{pct:3d}%] {total_ok}/{len(active)} inserted")
            else:
                total_err += len(batch)
                print(f"  ERROR batch ending at product {pid}: HTTP {status}")
                if err: print(f"    {err[:300]}")
            batch = []
            time.sleep(0.1)  # be gentle with rate limits

    print(f"\nDone! {total_ok} inserted, {total_err} errors")
    if total_err == 0:
        print("Run in Supabase SQL Editor: SELECT COUNT(*) FROM products;")
        print(f"Expected: {len(active)}")

if __name__ == '__main__':
    main()
