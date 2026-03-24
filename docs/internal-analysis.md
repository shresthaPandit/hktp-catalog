# HK Trailer Parts - Internal Team Document

## Project: Wholesale Parts E-Commerce Platform
## Status: Pre-Development - Awaiting Client Data
## Last Updated: January 24, 2026

---

## Project Overview

Building a modern, serverless e-commerce platform for HK Trailer Parts to replace their existing Yii2/PHP website. Primary goals:
- Sub-500ms search (currently 2-5+ seconds)
- WhatsApp order notifications
- Shopping cart and inquiry-based orders
- Admin dashboard

---

## Executive Summary: Current Site Problems

### Critical Issues Found (Must Fix)

| # | Problem | Impact | Our Solution |
|---|---------|--------|--------------|
| 1 | **No visible way to order** - No cart icon, no Add to Cart button visible (cart may exist behind login but /checkout returns 404) | Users don't know how to order | Shopping cart + inquiry system with clear UI |
| 2 | **Search takes 2-5+ seconds** - No indexes, no caching, fires on every keystroke | Users abandon searches | 3-tier search, <500ms response |
| 3 | **~60% products missing images** - Placeholder images throughout | Poor user experience | Keep existing CDN, add fallbacks |
| 4 | **No product descriptions** - Name field = description | Users lack info to decide | Import from DB if available |
| 5 | **Prices hidden everywhere** - Users must call to get quotes | Friction in buying process | Optional: show prices if client wants |

### Performance Issues Found

| # | Problem | Current | Target |
|---|---------|---------|--------|
| 1 | Search response time | 2-5+ seconds | <500ms |
| 2 | Page load time | ~4-6 seconds | <2 seconds |
| 3 | Search fires on every keystroke | 9 requests for "brake pad" | 1 request (debounced) |
| 4 | No CDN for assets | Single server | Global edge caching |
| 5 | Images not lazy loaded | All load at once | Lazy load on scroll |

### Data Quality Issues Found

| Issue | Count/Percentage |
|-------|------------------|
| Products without descriptions | ~95% |
| Products without images | ~60% |
| Empty cross-references | ~90% |
| Brands with 0 products | 8 brands |
| Product count discrepancy | 3,400 shown vs 15,000 claimed |

---

## Inputs Required

Before we can begin Phase 1 development, we need:

| Item | Priority | Status |
|------|----------|--------|
| Database access (credentials, API, or export) | **CRITICAL** | Waiting |
| Product data field mapping | **HIGH** | Waiting |
| Admin WhatsApp phone number | MEDIUM | Waiting |
| Company logo (high-res) | LOW | Waiting |
| Domain provider info | LOW | Waiting (needed at launch) |

---

## Findings from Live Site Analysis (hktrailerparts.com)

Before requesting data from the client, we analyzed the live website and confirmed the following:

### 1. Technology Stack Confirmed

| Component | Finding | Evidence |
|-----------|---------|----------|
| Framework | **Yii2 PHP** | Form handlers, validation patterns, URL structure |
| Database | MySQL | Standard Yii2 stack |
| Frontend | jQuery + Bootstrap + Owl Carousel | Inline scripts, DOM manipulation |
| Search | AJAX POST to `/search-by-part` | Keyup event listener in JS |
| Image CDN | `hkmis.ca/web/product-images/` | Separate server from main site |
| Reviews | Google Places API | Hardcoded Place ID in production code |

### 2. Product Data Structure (Observed)

| Field | Confirmed Present | Format/Example |
|-------|-------------------|----------------|
| SKU | Yes | `HK0003555` (pattern: HK000XXXX) |
| Product ID / Part Number | Yes | `VS-40719-3` |
| Product Name | Yes | "HUB CAP, TRAILER, PRO-LB, HP, GREESE" |
| Brand | Yes | HENDRICKSON, AUTOMANN, etc. |
| Category | Yes | Multiple per product |
| Stock Status | Yes | "In Stock" / "Out of Stock" |
| Cross References | Yes | Alternative part numbers listed |
| Price | **HIDDEN** | Not visible to public |
| Description | Minimal | Most products lack detailed descriptions |
| Images | Partial | Many show "image-coming-soon.png" placeholder |

### 3. Catalog Size (Observed vs. Claimed)

| Metric | Observed on Site | CLAUDE.md Claim | Verification |
|--------|------------------|-----------------|--------------|
| Total Products | **~3,392** (212 pages x 16/page) | 15,000 | CONFIRMED via pagination |
| Categories | 70+ subcategories | Not specified | Counted in filter sidebar |
| Brands | **228 brands** | Not specified | CONFIRMED on /brands page |
| Top Brand | Automann (994 products) | - | CONFIRMED |
| Products per page | 16 | - | CONFIRMED |

**CRITICAL DISCREPANCY:** Site shows ~3,400 products but spec claims 15,000. Possible explanations:
1. Database has inactive/hidden products not shown on frontend
2. Spec number was outdated or incorrect
3. Products filtered by stock status or other criteria

**Action Item:** Clarify actual product count with client before Phase 1.

### 4. Category Structure

- **Depth:** 2 levels (Main -> Sub)
- **URL Pattern:** `/categorysearch?id=[number]`
- **Examples:**
  - Air System & Components
  - Brake System -> Brake Chambers, S-cam/Camshafts
  - Suspension & Air Bags
  - Trailer Lights
  - Manufacturer-specific (Great Dane, Wabash, Manac, Hyundai)

### 5. Brand Information

- **Total Brands:** 228
- **URL Pattern:** `/brandsearch?id=[number]`
- **Product Distribution:**
  - Automann: 994 products (largest)
  - Air Fittings: 254
  - Hendrickson: 212
  - Fairview: 232
  - Many brands: 1-2 products only

### 6. Current Site Limitations Confirmed

#### Critical UX Issues

| Limitation | Evidence | Impact |
|------------|----------|--------|
| **No Visible Cart/Order UI** | No cart icon in header, no "Add to Cart" on products | Users don't know how to order |
| **Cart Behind Login (Maybe)** | `/cart` redirects to login, but `/checkout` = 404 | Even if cart exists, no checkout flow |
| **No Inquiry Form** | No contact/quote form on product pages | Users cannot request pricing |
| **No Order History** | `/my-orders` returns 404 | No self-service order tracking |
| Pricing Hidden | Price field visible but empty on all products | Users must call for quotes |
| Poor Image Coverage | ~60%+ products show "image-coming-soon.png" | Poor user experience |
| No User Dashboard | Login exists but unclear what it unlocks | Confusing user experience |

#### Data Quality Issues

| Issue | Evidence | Count/Impact |
|-------|----------|--------------|
| Empty Descriptions | Product name = description (no detail) | ~95% of products |
| Missing Images | Placeholder image used | ~60%+ products |
| Empty Cross-References | "No cross references added" message | Most products |
| Dead Brand Links | Brands showing "0 Products" | 8 brands (ECC, Erie, HK, etc.) |
| No Specifications | No dimensions, weight, materials | All products |

#### Navigation Issues

| Issue | Evidence |
|-------|----------|
| No Breadcrumbs | Product pages don't show category path |
| No Category on Detail Page | Category not displayed on product detail |
| Confusing URL Structure | Query params instead of SEO-friendly URLs |

### 7. Business Information (Pre-Confirmed)

| Info | Value |
|------|-------|
| Phone | +1 (647) 282-6031 (24/7) |
| Email | info@hktrailerparts.com |
| Address | 120 Orenda Rd #1d, Brampton, ON L6W 1W2 |
| Hours | Mon-Fri 9am-6:30pm, Sat 9am-6pm |
| Locations | Brampton (primary), Montreal |
| Social | Facebook, Instagram, LinkedIn |

**No need to ask client for this info - already public.**

### 8. Image Hosting Discovery

- **Primary CDN:** `https://hkmis.ca/web/product-images/`
- **Pattern:** `[hash]HKLogo.jpg` or product-specific images
- **Fallback:** `/images/image-coming-soon.png`
- **Finding:** Images hosted on separate domain (hkmis.ca), likely their internal management system

**Question for Client:** Is hkmis.ca your internal system? Can we continue using these image URLs?

### 9. URL Patterns (For Migration Reference)

| Page Type | Current Pattern | Notes |
|-----------|-----------------|-------|
| Products List | `/products?pageno=X` | Paginated |
| Product Detail | `/product-details?id=XXXX` | ID-based (e.g., id=3563) |
| Category | `/categorysearch?id=XX` | Query param |
| Brand | `/brandsearch?id=XX` | Query param |
| Search | `/search-by-part` (POST) | AJAX endpoint |

**SEO Issue:** All URLs use query parameters instead of clean paths like `/products/brake-pads/HK0003563`

### 10. Product Detail Page Analysis (VERIFIED)

Tested with product ID 3563 (`/product-details?id=3563`):

**Fields Present:**
| Field | Value | Status |
|-------|-------|--------|
| SKU | HK0003563 | Present |
| Part Number | 197141XZN | Present |
| Product Name | "8X1" FLAT SOCKET WOOD SCREW ZINC PLATED" | Present |
| Brand | POMAR | Present |
| Stock | "1500 in stock" | Present with quantity! |
| Price | Not shown | **HIDDEN** |
| Description | None (just product name) | **MISSING** |
| Image | image-coming-soon.png | **PLACEHOLDER** |
| Category | Not shown | **MISSING** |
| Cross-References | "No cross references added" | **EMPTY** |

**Critical Finding:** Stock quantity IS tracked (shows "1500 in stock") but price is hidden.

**Related Products:** Shows 8 similar items at bottom of page.

### 11. User Journey Analysis - ORDERING FLOW

**Investigation: Is ordering behind login?**

| URL Tested | Result |
|------------|--------|
| `/cart` | **Redirects to login** - suggests cart may exist for logged-in users |
| `/checkout` | 404 - page doesn't exist |
| `/order` | 404 - page doesn't exist |
| `/my-orders` | 404 - page doesn't exist |
| `/customer` | 404 - page doesn't exist |

**Finding:** Cart functionality MAY exist behind authentication, but the UX is still problematic:

#### What's Visible to Non-Logged-In Users:
- ❌ No cart icon in header
- ❌ No "Add to Cart" button on product pages
- ❌ No indication that logging in enables cart
- ❌ No "Login to order" message
- ✅ Login link exists ("Hello, Log In My Account")

#### What's Missing Even for Logged-In Flow:
- `/checkout` returns 404 - no checkout page exists
- `/my-orders` returns 404 - no order history page
- No mention of cart/orders in login page benefits

**Conclusion:** Even IF cart exists behind login:
1. Users don't know it exists (no visual cues)
2. No checkout flow exists (404)
3. No order history exists (404)
4. This is still a **major UX problem** - hidden functionality with no discoverability

**Action Item:** Ask client to clarify:
- Does cart functionality exist for logged-in users?
- How do customers currently place orders?
- Is the site purely for catalog browsing with phone orders?

**Likely Reality:** Site is catalog-only, orders happen via phone/email manually.

---

## Updated Questions for Client (Refined)

Based on our analysis, here's what we **still need** vs. what we **already know**:

### Already Confirmed (No Need to Ask)

- [x] Business contact info (phone, email, address)
- [x] Technology stack (Yii2/PHP/MySQL)
- [x] Category structure (2-level)
- [x] Brand count (~228)
- [x] SKU format (HK000XXXX)
- [x] Image CDN location (hkmis.ca)

### Still Need from Client

| Item | Priority | Why We Need It |
|------|----------|----------------|
| Database access (Option A/B/C) | **CRITICAL** | Can't proceed without data |
| **How do orders currently work?** | **HIGH** | Cart exists behind login? Phone only? Need to understand current flow |
| Actual product count | HIGH | Site shows ~3,400 but spec says 15,000 |
| Pricing data location | HIGH | Prices hidden from site - need DB access |
| Product description data | MEDIUM | Most products lack descriptions |
| hkmis.ca relationship | MEDIUM | Confirm we can use existing image URLs |
| WhatsApp admin number | MEDIUM | For notification setup |
| Domain provider | LOW | For DNS update at launch |

---

## Technical Notes

### Search Performance Issues (Current Site) - DETAILED ANALYSIS

The current search implementation has multiple critical flaws:

#### 1. No Debouncing (CONFIRMED)

```javascript
// Current implementation (observed in source)
$("#search_by_part").keyup(function() {
    // Fires on EVERY keystroke - no delay
    $.ajax({ ... })
})
```

**Problem:** Typing "brake pad" sends 9 separate AJAX requests:
- "b" → request 1
- "br" → request 2
- "bra" → request 3
- ... and so on

**Impact:** Server overload, wasted bandwidth, slow response for user.

#### 2. POST Instead of GET

**Current:** `POST /search-by-part`
**Problem:** POST requests cannot be cached by CDN/browser
**Should be:** `GET /search?q=brake+pad` (cacheable)

#### 3. No Minimum Character Limit

**Current:** Searches trigger on first character
**Problem:** Single letter searches return massive result sets
**Should be:** Minimum 2-3 characters before search triggers

#### 4. No Error Handling

```javascript
// Current implementation lacks error callback
$.ajax({
    url: '/search-by-part',
    success: function(data) { ... }
    // NO error: function() {}
    // NO timeout handling
})
```

**Impact:** If search fails, user sees nothing - no error message.

#### 5. Full Table Scans (Assumed from Behavior)

**Evidence:** 2-5+ second response times for simple queries
**Cause:** MySQL without proper indexes does `LIKE '%term%'` on every row
**With 15K products:** Each search scans all 15,000 rows sequentially

#### 6. No Search Suggestions/Autocomplete

**Current:** Shows result count only, requires page reload to see results
**Should have:** Dropdown with top 5-10 matching products as you type

#### 7. No Caching Layer

**Evidence:** Same search term takes same time on repeat
**Should have:** Redis/Memcached caching frequent searches

### Additional Technical Problems Found

#### Code Quality Issues

| Issue | Evidence | Severity |
|-------|----------|----------|
| Console.log in production | `console.log()` statements visible | LOW |
| Inline JavaScript | ~200+ lines of JS embedded in HTML | MEDIUM |
| Hardcoded API keys | Google Place ID visible in source | MEDIUM |
| No minification | Full readable JS/CSS served | LOW |
| Debug code in production | Development artifacts remain | LOW |

#### Performance Issues

| Issue | Evidence | Impact |
|-------|----------|--------|
| No lazy loading | All images load immediately | Slow page load |
| Google Maps API on every page | Reviews widget loads everywhere | +500ms load time |
| Owl Carousel overhead | Heavy library for simple slider | +100KB JS |
| No CDN for assets | CSS/JS served from origin | Slower global access |
| Full Bootstrap loaded | Only using ~20% of features | +150KB CSS |

#### Security Concerns

| Issue | Risk Level |
|-------|------------|
| No visible CSRF tokens on forms | MEDIUM |
| jQuery version unknown (may be outdated) | LOW-MEDIUM |
| Inline event handlers | LOW |

### Proposed Solution (Expanded)

Our 3-tier search algorithm will provide:

**Tier 1: Exact SKU Match** (Weight: 1.0, Speed: <10ms)
```sql
WHERE sku ILIKE 'HK0003563'  -- Uses index, instant
```

**Tier 2: Full-Text Search** (Weight: 0.8, Speed: <50ms)
```sql
WHERE search_vector @@ websearch_to_tsquery('english', 'brake pad')
-- Uses GIN index on pre-computed tsvector
```

**Tier 3: Fuzzy ILIKE Match** (Weight: 0.3, Speed: <200ms)
```sql
WHERE name ILIKE '%brake%' OR category ILIKE '%brake%'
-- Fallback for typos and partial matches
```

**Combined with:**
- **Debounced input:** 300ms delay before search fires
- **Minimum 2 characters:** No single-letter searches
- **GET requests:** Cacheable at edge
- **Proper indexes:** On sku, name, category, brand, search_vector
- **Edge caching:** Vercel caches common searches globally
- **Error handling:** User-friendly error messages
- **Loading states:** Skeleton UI while searching
- **Instant preview:** Dropdown shows top 5 results immediately

---

---

## Problem-to-Solution Mapping

### How Our New Site Fixes Each Problem

| Current Problem | Root Cause | Our Solution | Implementation |
|-----------------|------------|--------------|----------------|
| **No way to order** | Missing UI components | Add to Cart + Checkout | Cart table + order creation |
| **Slow search (2-5s)** | No indexes, no debounce | 3-tier search algorithm | PostgreSQL tsvector + indexes |
| **Search fires every keystroke** | No debouncing in JS | 300ms debounce | Client-side debounce hook |
| **POST search (uncacheable)** | Wrong HTTP method | GET with query params | Server action with caching |
| **No error handling** | Missing error callbacks | Full error states | Try/catch + user feedback |
| **No lazy loading** | Images load all at once | Next.js Image component | Automatic lazy loading |
| **Heavy JS bundle** | jQuery + Bootstrap + Owl | Modern React | Tree-shaking, code splitting |
| **No CDN** | Single origin server | Vercel Edge Network | Automatic global CDN |
| **No mobile optimization** | Desktop-first design | Mobile-first Tailwind | Responsive from start |
| **Missing product info** | Data quality issue | Import what exists | Map available fields |
| **Prices hidden** | Business decision | Optional price display | Configurable per client |

### Search: Before vs After

| Aspect | Current Site | New Site |
|--------|-------------|----------|
| Response time | 2-5+ seconds | <500ms |
| Requests per search | 9 (for "brake pad") | 1 |
| Caching | None | Edge + browser |
| Error handling | None | Full UI feedback |
| Loading state | None | Skeleton UI |
| Autocomplete | None | Top 5 results dropdown |
| Indexing | Full table scan | GIN index on tsvector |

---

## Data Migration Considerations

### Field Mapping (Estimated)

| Our Schema | Likely PHP Field | Notes |
|------------|------------------|-------|
| `external_id` | `id` | Primary key from their DB |
| `sku` | `part_number` or `sku` | HK000XXXX format |
| `name` | `product_name` or `name` | Need to confirm |
| `description` | `description` | May be sparse |
| `category` | `category_id` (FK) | Need category table too |
| `brand` | `brand_id` (FK) | Need brand table too |
| `price` | `price` or `cost` | Hidden from frontend |
| `in_stock` | `stock_status` | Boolean or string |
| `image_urls` | `images` | May be comma-separated |
| `primary_image_url` | `main_image` | Need to confirm |

### Image Migration Options

1. **Keep existing URLs** (preferred) - Continue using hkmis.ca CDN
2. **Migrate to Supabase Storage** - More control, adds complexity
3. **Use external CDN** - Cloudinary, etc. - Adds cost

Recommendation: Keep existing URLs if client confirms hkmis.ca will remain available.

---

## Risk Assessment

### Data Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Product count mismatch (3,400 vs 15,000) | **HIGH** | MEDIUM | Clarify with client before Phase 1 |
| Missing descriptions | **HIGH** | LOW | Proceed without - not critical for MVP |
| Image URL changes | LOW | HIGH | Confirm hkmis.ca stability with client |
| Database access delays | MEDIUM | HIGH | Have CSV export as backup option |
| Pricing data unavailable | MEDIUM | LOW | Price display is optional for MVP |
| Cross-reference data sparse | HIGH | LOW | Feature can be added later |

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| hkmis.ca goes offline | LOW | **CRITICAL** | Backup images to Supabase Storage |
| Client API unstable | MEDIUM | HIGH | Build robust retry logic in n8n |
| Data format inconsistent | MEDIUM | MEDIUM | Validate all fields during sync |

### Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Users expect current (broken) flow | LOW | LOW | New site is clearly better |
| Admin not checking WhatsApp | MEDIUM | HIGH | Add email backup notification |
| High volume on launch | LOW | MEDIUM | Supabase/Vercel scale automatically |

---

## Next Steps

1. **DONE:** Analyze live website
2. **DONE:** Document findings (this document)
3. **TODO:** Send refined questions to client
4. **WAITING:** Receive database access
5. **NEXT:** Begin Phase 1 upon data receipt

---

## Timeline (From Data Receipt)

| Day | Milestone |
|-----|-----------|
| Day 0 | Receive database access |
| Day 1-2 | Analyze schema, map fields |
| Day 3-4 | Set up Supabase, create tables |
| Day 5-7 | Build product catalog |
| Day 8-10 | Implement search |
| Day 11-14 | Complete Phase 1 |
| Day 15-21 | Phase 2 (Cart, Orders, WhatsApp) |
| Day 22-28 | Phase 3 (Testing, Security, Launch) |

---

## Document History

| Date | Change | Author |
|------|--------|--------|
| Jan 24, 2026 | Initial creation | Dev Team |
| Jan 24, 2026 | Added website analysis findings | Dev Team |
| Jan 24, 2026 | Deep-dive verification: confirmed all findings, expanded search issues, added product detail analysis, documented critical UX blockers | Dev Team |
| Jan 24, 2026 | Investigated login-protected features: /cart redirects to login but /checkout returns 404 - ordering flow unclear, added question for client | Dev Team |
