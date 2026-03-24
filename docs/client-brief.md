# HK Trailer Parts - New Website Project Brief

## For: HK Trailer Parts Team
## Prepared by: Development Team
## Date: January 24, 2026

---

## Why Your Current Website Search is Slow

Your current website (hktrailerparts.com) runs on older technology that wasn't designed to handle 15,000+ products efficiently. Here's what's happening:

### The Problem

1. **Traditional Server Architecture**
   - Every search request travels to a single server in one location
   - The server processes the search, queries the database, and sends results back
   - During busy times, requests queue up and wait their turn

2. **Database Without Search Optimization**
   - Standard MySQL databases store data but aren't optimized for fast text searching
   - When someone searches "brake pad," the database scans through all 15,000 products one by one
   - No specialized search indexes exist to speed this up

3. **No Caching**
   - Every identical search repeats the full database scan
   - If 10 people search "oil filter" in an hour, the server does the same work 10 times

4. **Single Server Location**
   - Your server is likely in one geographic location
   - Customers far from that location experience additional delay (latency)

### The Result
- Search times of 2-5+ seconds (should be under 0.5 seconds)
- Frustrated customers who leave before finding products
- Lost sales opportunities

---

## How the New Website Solves This

| Issue | Current Site | New Site |
|-------|-------------|----------|
| Server Location | Single location | Global CDN (worldwide) |
| Search Method | Full table scan | 3-tier optimized search with indexes |
| Database | Standard MySQL | PostgreSQL with full-text search vectors |
| Caching | None | Automatic edge caching |
| Response Time | 2-5+ seconds | Under 0.5 seconds |

### New Search System (3-Tier Algorithm)
1. **Tier 1:** Exact SKU match (instant results for part numbers)
2. **Tier 2:** Full-text search using pre-built search indexes
3. **Tier 3:** Fuzzy matching for partial matches and typos

---

## What We've Already Confirmed

We analyzed your current website (hktrailerparts.com) and confirmed the following:

| Item | Status | Details |
|------|--------|---------|
| Technology Stack | Confirmed | Yii2 PHP with MySQL database |
| SKU Format | Confirmed | HK000XXXX pattern (e.g., HK0003555) |
| Categories | Confirmed | 60+ categories, 2-level structure |
| Brands | Confirmed | 228 brands (Automann largest with 994 products) |
| Contact Info | Confirmed | Phone, email, address already on site |
| Image Hosting | Found | Images hosted at hkmis.ca |

**We observed ~3,400 products on the live site, but our spec mentions 15,000. Please clarify the actual count.**

---

## What We Still Need From You

### 1. Database Access (Required - Critical)

We need read-only access to export your product data:

**Option A: Direct Database Access (Preferred)**
- MySQL database credentials (host, username, password, database name)
- We only need SELECT (read) permissions
- We will never modify your existing data

**Option B: API Endpoint**
- If you have an existing API that returns product data
- Provide the endpoint URL and any authentication keys

**Option C: Data Export**
- Export your products table as CSV or SQL dump
- Include: SKU, name, description, category, brand, price, stock status, images

### 2. Product Data Clarification

Please confirm:

| Question | Your Answer |
|----------|-------------|
| Total product count in database? | _______________ (site shows ~3,400) |
| Are there inactive/hidden products? | Yes / No |
| Do products have descriptions? | Yes / No (we noticed most are blank) |
| Where is pricing stored? | _______________ (not visible on site) |

### 3. Image Hosting (hkmis.ca)

We noticed your product images are hosted at `hkmis.ca/web/product-images/`:

- Is hkmis.ca your internal management system?
- Can we continue using these image URLs for the new site?
- Will these URLs remain stable long-term?

### 4. Admin Contact for WhatsApp Notifications

The new system sends instant WhatsApp messages when orders come in:

- **Admin Phone Number:** _______________ (with country code, e.g., +1-647-XXX-XXXX)
- **Backup Phone Number:** _______________ (optional)

### 5. Additional Assets

| Item | Needed? | Notes |
|------|---------|-------|
| Company logo (high-res PNG/SVG) | Yes | For header and branding |
| Domain provider info | At launch | Who manages hktrailerparts.com DNS? |

---

## Timeline Overview

Once we have the prerequisites above:

| Phase | Duration | What Happens |
|-------|----------|--------------|
| **Phase 1** | Week 1-2 | Database setup, authentication, product catalog |
| **Phase 2** | Week 3 | Shopping cart, orders, WhatsApp notifications |
| **Phase 3** | Week 4 | Testing, security, launch |

**Total: 4 weeks from receiving data access**

---

## New Features You'll Get

1. **Lightning-Fast Search** - Under 0.5 seconds
2. **Shopping Cart** - Customers can save items and return later
3. **Inquiry Orders** - Customers submit orders, you receive instant WhatsApp alerts
4. **Order History** - Customers can view their past inquiries
5. **Admin Dashboard** - See all orders, update statuses, view analytics
6. **Mobile-Friendly** - Works perfectly on phones and tablets
7. **Automatic Data Sync** - Products update every 30 minutes from your database

---

## Monthly Operating Cost

| Service | Cost |
|---------|------|
| Hosting (Vercel) | $0 |
| Database (Supabase) | $0 |
| Automation (n8n) | $20/month |
| WhatsApp Messages (Twilio) | ~$5/month |
| **Total** | **~$25-30/month** |

---

## Next Steps

1. **Review this document**
2. **Fill in the data fields table above**
3. **Provide database access** (Option A, B, or C)
4. **Schedule a quick call** to answer any questions

Once we have data access, we can begin immediately.

---

## Questions?

Contact us at: [Your Contact Info]

We're excited to build you a fast, modern website that will help you serve your customers better!
