# PHP API Contract — Product Sync Endpoint

**Version:** 1.0
**Date:** 2026-04-09
**Audience:** Client PHP developer
**Purpose:** Defines the HTTP endpoint that the n8n product sync workflow fetches products from every 30 minutes.

---

## Endpoint

```
GET /api/products/sync
Host: {CLIENT_API_URL}
```

`CLIENT_API_URL` is the base URL of the client's PHP application (e.g., `https://api.example.com`). This value is provided by the client when their API is live and stored as the `CLIENT_API_URL` environment variable in n8n.

---

## Authentication

Every request from n8n includes the following HTTP header:

```
X-API-Key: {CLIENT_API_KEY}
```

The client generates a static API key of their choice. n8n stores it as the `CLIENT_API_KEY` environment variable and sends it on every request.

**Behavior:**
- If the `X-API-Key` header is missing or does not match the expected key, return `401 Unauthorized`.
- The key should be treated as a bearer secret — keep it out of logs.

---

## Request Parameters

All parameters are passed as query string values.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `updated_since` | ISO 8601 datetime string | No | — | If present, return only products where `updated_at >= updated_since`. If absent, return all products (full sync). |
| `page` | integer | No | 1 | Page number, 1-indexed. |
| `limit` | integer | No | 500 | Number of items per page. Maximum allowed value: 1000. |

---

## Response Schema (HTTP 200)

```json
{
  "data": [
    {
      "external_id": "string — unique ID in client system",
      "sku": "string — unique product code (PRIMARY UPSERT KEY — must never change)",
      "name": "string",
      "description": "string or null",
      "category": "string or null",
      "subcategory": "string or null",
      "brand": "string or null",
      "price": "number or null (decimal, e.g. 29.99)",
      "image_urls": ["string (full absolute URL)"],
      "primary_image_url": "string or null",
      "specifications": {},
      "in_stock": "boolean",
      "updated_at": "ISO 8601 datetime string"
    }
  ],
  "page": 1,
  "limit": 500,
  "total": 15000,
  "has_more": true
}
```

**Field types at a glance:**

| Field | Type | Nullable | Notes |
|-------|------|----------|-------|
| `external_id` | string | No | Client's internal database ID |
| `sku` | string | No | Unique product code — never changes |
| `name` | string | No | Product display name |
| `description` | string | Yes | Full product description |
| `category` | string | Yes | Top-level category |
| `subcategory` | string | Yes | Sub-category under category |
| `brand` | string | Yes | Product brand/manufacturer |
| `price` | number (decimal) | Yes | e.g. `29.99` |
| `image_urls` | array of strings | No (empty array if none) | Full absolute URLs |
| `primary_image_url` | string | Yes | If null, first element of `image_urls` is used |
| `specifications` | object | Yes (empty object if none) | Flat or nested key-value attributes |
| `in_stock` | boolean | No | `true` = available, `false` = out of stock |
| `updated_at` | string (ISO 8601) | No | UTC datetime of last product change |

**Pagination envelope fields:**

| Field | Type | Description |
|-------|------|-------------|
| `page` | integer | Current page number (mirrors request) |
| `limit` | integer | Items per page (mirrors request) |
| `total` | integer | Total number of matching products (across all pages) |
| `has_more` | boolean | `true` if more pages exist; `false` if this is the last page |

---

## Error Responses

| HTTP Status | When to Return |
|-------------|---------------|
| `401 Unauthorized` | `X-API-Key` header is missing or does not match the expected key |
| `400 Bad Request` | A parameter is malformed (e.g., `updated_since` cannot be parsed as a valid datetime, `page` or `limit` is not a positive integer) |
| `500 Internal Server Error` | Unexpected server error — n8n will log the error and mark the sync run as failed |

All error responses should include a JSON body with a human-readable `error` field:

```json
{
  "error": "Invalid updated_since format. Expected ISO 8601 UTC datetime string."
}
```

---

## Example Requests

```
# Full sync — returns all products, page 1
GET /api/products/sync?page=1&limit=500
X-API-Key: your-api-key-here

# Incremental sync — products updated since a specific timestamp, page 1
GET /api/products/sync?updated_since=2026-04-09T14:00:00Z&page=1&limit=500
X-API-Key: your-api-key-here

# Second page of incremental sync
GET /api/products/sync?updated_since=2026-04-09T14:00:00Z&page=2&limit=500
X-API-Key: your-api-key-here
```

---

## Field Notes for Client Developer

These notes are critical for correct sync behavior. Please read them carefully before implementing.

1. **`sku` is the upsert key.** It must be unique across all products and must never change for a given product once assigned. n8n uses `sku` as the conflict-resolution key when inserting or updating products in Supabase (`ON CONFLICT (sku) DO UPDATE`). If a SKU changes, the old product will remain in the database orphaned and a new product will be created.

2. **`external_id` is for reference only.** It is the client's internal database ID and is stored in Supabase for traceability, but it is not the deduplication key. `sku` is.

3. **`updated_at` must reflect every product change.** This field drives incremental sync. If a product's price, stock status, name, description, or any other field changes, `updated_at` must be updated to the current UTC timestamp. If `updated_at` does not change, n8n will not re-sync the product on incremental runs.

4. **`specifications` is stored as JSONB in Supabase.** It should be a flat or nested JSON object of key-value product attributes. Examples: `{"weight_kg": 12.5, "material": "steel"}` or `{"engine": {"displacement_cc": 1998, "cylinders": 4}}`. Arrays within specifications are also supported.

5. **`image_urls` must be full absolute URLs.** Do not send relative paths. Example: `"https://cdn.example.com/images/part-123.jpg"`. If `primary_image_url` is not provided (null), n8n will use the first element of `image_urls` as the primary.

6. **Empty `data` arrays are valid responses.** If no products match the `updated_since` filter, return:
   ```json
   {"data": [], "page": 1, "limit": 500, "total": 0, "has_more": false}
   ```
   Do not return a non-200 status code in this case.

7. **All datetime strings must be UTC in ISO 8601 format.** Example: `2026-04-09T14:30:00Z`. Do not use local timezone offsets.

8. **The endpoint must be safe to call concurrently.** n8n may retry a request if a transient network error occurs. Implement the endpoint as idempotent — multiple identical requests must produce the same result without side effects.

---

## n8n Integration Notes

These notes are for internal reference (not required reading for the PHP developer, but included for completeness).

- n8n polls this endpoint on a **30-minute Schedule Trigger** for incremental syncs.
- For incremental sync, n8n passes `updated_since` = the `completed_at` timestamp of the most recent successful row in `sync_logs`.
- For full sync (manual trigger via n8n Webhook node), n8n calls the endpoint **without** `updated_since`.
- n8n uses a pagination loop: fetch page 1 → if `has_more = true`, fetch page 2 → continue until `has_more = false`.
- At 500 products per page and 15,000 total products, a **full sync requires 30 HTTP requests**.
- After fetching all pages, n8n splits products into batches of 100 and UPSERTs each batch to Supabase using the Postgres node.
- The `search_vector` column in Supabase is populated automatically by a database trigger on INSERT/UPDATE — n8n does **not** write this column.
- n8n stores `CLIENT_API_URL` and `CLIENT_API_KEY` as workflow environment variables. These must be configured by the operator once the client API is live.

---

## Implementation Checklist (for PHP developer)

- [ ] `GET /api/products/sync` route exists and is publicly reachable
- [ ] `X-API-Key` header validation returns 401 on missing/invalid key
- [ ] `updated_since` parameter filters by `updated_at >= updated_since` (inclusive)
- [ ] `page` and `limit` parameters implement offset pagination correctly
- [ ] Response envelope includes `data`, `page`, `limit`, `total`, `has_more`
- [ ] `has_more` is `false` on the last page (when `page * limit >= total`)
- [ ] All `updated_at` values in response are UTC ISO 8601 strings
- [ ] All `image_urls` values are full absolute URLs
- [ ] `specifications` is a JSON object (not a serialized string)
- [ ] Empty result set returns `{"data": [], ..., "has_more": false}` with HTTP 200
- [ ] Endpoint is idempotent (safe to retry)
- [ ] `updated_at` is updated in the database whenever any product field changes
