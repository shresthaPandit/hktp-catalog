# CLAUDE.md - Wholesale Parts E-Commerce Platform

## Project Overview

| Field | Value |
|-------|-------|
| **Type** | B2B E-Commerce / Order Inquiry System |
| **Timeline** | 4 Weeks (28 Days) |
| **Budget** | $25-30/month operational |
| **Architecture** | 100% Serverless |

**Purpose:** Serverless e-commerce platform for wholesale mechanical parts. Customers browse products, add to cart, and submit inquiry orders. Admins receive WhatsApp notifications and contact customers to finalize quotes.

**Key Metrics:**
- 15,000 products (synced from client's PHP database)
- 4,000+ expected users
- 50+ orders/day
- <500ms search response
- <30s WhatsApp delivery
- 99%+ uptime

---

## Technology Stack

| Layer | Technology | Cost |
|-------|-----------|------|
| Frontend | Next.js 15 | $0 |
| Hosting | Vercel Free Tier | $0 |
| Database | Supabase (PostgreSQL) | $0 |
| Automation | n8n Cloud Starter | $20/mo |
| Messaging | Twilio WhatsApp | ~$5/mo |

---

## User Roles

### Customer
- Browse/search product catalog
- Filter by category, brand, stock status
- Add products to cart, update quantities
- Place inquiry orders with company info
- View order history and status

### Admin
- All customer capabilities
- View all orders from all customers
- Update order status, add internal notes
- View analytics dashboard
- Monitor database sync status

---

## Core Workflows

### 1. Customer Places Order
1. Customer searches/browses products
2. Adds items to cart
3. Fills checkout form (company name, phone, notes)
4. System creates order with JSON snapshots
5. Cart cleared, confirmation shown
6. Supabase webhook triggers n8n -> Twilio WhatsApp to admin

### 2. Admin Processes Order
1. Admin receives WhatsApp notification
2. Reviews order in dashboard
3. Contacts customer, updates status: pending -> contacted -> processing -> completed

### 3. Database Sync (Every 30 min)
1. n8n cron triggers
2. Fetches last sync timestamp
3. Calls client PHP API with `updated_since`
4. Transforms and UPSERTs to Supabase in batches of 100
5. Logs results; alerts on 3 consecutive failures

---

## Database Schema

### Table: products

```sql
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
  in_stock BOOLEAN DEFAULT true,
  search_vector TSVECTOR,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_in_stock ON products(in_stock);
CREATE INDEX idx_products_search ON products USING GIN(search_vector);
```

**RLS:** Anyone can SELECT; only admins can modify.

### Table: profiles

```sql
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

CREATE INDEX idx_profiles_role ON profiles(role);
```

**Trigger:** Auto-create profile on user signup.
**RLS:** Users view own profile; admins view all.

### Table: cart_items

```sql
CREATE TABLE cart_items (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_cart_items_user ON cart_items(user_id);
```

**RLS:** Users manage own cart only.

### Table: orders

```sql
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

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_number ON orders(order_number);

CREATE SEQUENCE order_number_seq START 1;
```

**Trigger:** Auto-generate order_number as `ORD-YYYY-NNNNN`.
**RLS:** Users view own orders; admins view all and can update.

### Table: daily_analytics

```sql
CREATE TABLE daily_analytics (
  date DATE PRIMARY KEY,
  total_orders INTEGER DEFAULT 0,
  total_inquiries INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  top_products JSONB,
  revenue DECIMAL(10,2),
  generated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_date ON daily_analytics(date DESC);
```

**RLS:** Admins only.

### Table: sync_logs

```sql
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

CREATE INDEX idx_sync_logs_status ON sync_logs(status);
CREATE INDEX idx_sync_logs_started ON sync_logs(started_at DESC);
```

**RLS:** Admins only.

---

## Database Functions

### search_products() - 3-Tier Search

```sql
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
    WHERE (p.name ILIKE '%' || search_query || '%' OR p.category ILIKE '%' || search_query || '%' OR p.brand ILIKE '%' || search_query || '%')
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
```

### get_cart_with_details()

```sql
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
```

---

## Frontend Structure (Next.js 15)

```
app/
├── (public)/           # No auth required
│   ├── page.tsx        # Homepage
│   ├── products/       # Catalog & details
│   ├── login/
│   └── signup/
├── (customer)/         # Auth required
│   ├── cart/
│   ├── checkout/
│   ├── orders/
│   └── profile/
├── (admin)/            # Admin role required
│   ├── dashboard/
│   ├── orders/
│   └── sync/
├── actions/            # Server Actions
│   ├── auth.ts
│   ├── cart.ts
│   ├── orders.ts
│   └── products.ts
└── middleware.ts       # Route protection

components/
├── ui/                 # Button, Card, Input, Modal, Toast
├── ProductCard.tsx
├── ProductGrid.tsx
├── SearchBar.tsx
├── CartBadge.tsx
├── Header.tsx
└── Footer.tsx

lib/
├── supabase/
│   ├── client.ts       # Browser client
│   ├── server.ts       # Server client
│   └── middleware.ts
├── types.ts
└── utils.ts
```

---

## UI/UX Design System

**Colors:**
- Primary: `#1F4E78` | Secondary: `#2E75B5` | Accent: `#5B9BD5`
- Success: `#10B981` | Warning: `#F59E0B` | Danger: `#EF4444`

**Typography:** Inter (headings 700, body 400), JetBrains Mono (SKU)

**Order Status Colors:**
- Pending: Orange | Contacted: Blue | Processing: Purple | Completed: Green | Cancelled: Red

---

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
N8N_WEBHOOK_ORDER_NOTIFICATION=https://n8n.cloud/webhook/xxxxx
NEXT_PUBLIC_APP_URL=https://wholesaleparts.com

# Used in n8n (reference)
CLIENT_API_URL=https://client-api.example.com
CLIENT_API_KEY=xxxxx
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_WHATSAPP_TO=whatsapp:+15551234567
```

---

## Phase-Wise Implementation

### Phase 1: Foundation (Days 1-14)
- Database setup (all tables, indexes, RLS, functions)
- Authentication (Supabase Auth, login/signup pages)
- Next.js project setup with folder structure
- Product catalog with pagination and filters
- 3-tier search implementation
- Manual sync workflow in n8n

### Phase 2: Core Features (Days 15-21)
- Shopping cart functionality
- Order creation with JSON snapshots
- Supabase webhook to n8n
- WhatsApp notifications via Twilio
- Admin dashboard

### Phase 3: Production (Days 22-28)
- Automated cron sync
- Security hardening (RLS audit, rate limiting)
- Error handling and logging
- Testing (unit, integration, E2E)
- Production deployment
- Launch

---

## Testing Requirements

- **Unit:** Server Actions, database functions, utilities
- **Integration:** User flows, sync workflow, WhatsApp flow
- **E2E (Playwright):** Customer order flow, admin flow, search, cart persistence
- **Performance:** Lighthouse >90, search <500ms, page load <2s
- **Security:** RLS enforcement, SQL injection, XSS, CSRF

---

## Deployment

**Pre-Deploy Checklist:**
- TypeScript errors resolved
- All tests passing
- Lighthouse >90
- Environment variables configured
- RLS policies verified
- Admin users created

**Deploy:** Merge to `main` -> Vercel auto-deploys -> Verify health -> Monitor

---

## Project Status

**Current:** v1.1 In Progress — Phase 7 complete, Phase 8 next

**Completed Phases:** 1–7 (Foundation → Phone OTP Signup)
**Next:** Phase 8 — Order Notifications (n8n webhook + WhatsApp)

---

## Supabase Configuration (Live)

### Phone Auth (Twilio)
- Provider: Twilio SMS
- Account SID: AC****************************** (see .env.local)
- Message Service SID: MG****************************** (see .env.local)
- OTP Expiry: 300 seconds | OTP Length: 6 digits
- **Twilio on Trial** — real SMS only to verified numbers; test number `919389919083=123456` configured in Supabase
- Upgrade Twilio before production launch

### Storage Bucket: invoices
- Private bucket, 10MB limit
- Allowed: PDF, JPG, PNG, WEBP
- Path pattern: `invoices/order-{orderId}/{timestamp}-{filename}`
- RLS: admin read/write/delete only

### profiles RLS Policies (clean — no recursion)
```sql
-- DO NOT add policies that query profiles from within profiles (causes infinite recursion)
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
```

### Making a user admin
```sql
INSERT INTO profiles (id, role, created_at, updated_at)
VALUES ('<uuid>', 'admin', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET role = 'admin';
-- Note: phone stored without + prefix in auth.users (e.g. 919389919083)
```

---

## Admin Dashboard Notes

- Admin users: header shows **Admin** button → `/admin/orders`; **My Orders** nav hidden
- Order detail page (`/admin/orders/[id]`): has ← Back button + Invoice upload section
- Invoice upload component: `app/(admin)/admin/orders/[id]/InvoiceUpload.tsx`

---

## Loyalty System (v1.2 — not started)
- Point rate config (1$=1 point) will live in admin panel
- Requirements: LOYAL-01 to LOYAL-04 in REQUIREMENTS.md
- Start with `/gsd:new-milestone` after v1.1 complete

---

**Project Files:**
- `CLAUDE.md` - Master specification
- `docs/client-brief.md` - Client document
- `docs/client-brief.html` - Word-compatible version
- `docs/internal-analysis.md` - Website analysis

---

**Document Version:** 1.3
**Last Updated:** April 4, 2026
