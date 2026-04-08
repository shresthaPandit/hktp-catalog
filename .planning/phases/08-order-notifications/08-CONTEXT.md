# Phase 8: Order Notifications - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire `createOrder` (server action) to call an n8n webhook after a successful DB insert. n8n formats and sends a WhatsApp message to the admin with full order details. If the webhook fails, the order is always saved and the error is recorded — no order is lost. No new customer-facing UI; admin sees WhatsApp delivery status in the existing orders UI.

</domain>

<decisions>
## Implementation Decisions

### Webhook call behavior
- Fire-and-forget — do NOT await the webhook call; customer redirect happens immediately
- 5-second timeout on the fetch call
- Retry once after 2 seconds if the first attempt fails (any non-200 or timeout)
- If both attempts fail, continue — order is the priority, webhook failure is non-fatal
- Webhook is called after the DB insert succeeds and cart is cleared

### Failure handling
- On failure: write `"{HTTP status}: {error message}"` (e.g. `"HTTP 503: Service Unavailable"` or `"Timeout after 5s"`) to `whatsapp_error` column
- Only the final failure is recorded (not both attempts)
- On success (200 response): write the current timestamp to `whatsapp_sent_at`, leave `whatsapp_error` null
- No resend button or retry UI in this phase — admin handles manually via WhatsApp if needed

### WhatsApp message content (formatted in n8n)
- Include: order number, customer company name, customer phone
- Include: full item list — every item with name, quantity, and price per item
- No truncation for large orders — show all items
- Include: customer notes if present (not empty)
- Include: subtotal (sum of all items)

### Admin UI visibility
- Orders list: add a small status indicator per row showing WhatsApp sent/failed
- Failed rows: add a subtle warning indicator (icon or color) so admin notices at a glance
- Order detail page: show sent timestamp if success (e.g. "WhatsApp sent at 2:34 PM"), or error message if failed (e.g. "WhatsApp failed: HTTP 503")
- Customer-facing pages (order confirmation, order history): no WhatsApp status shown — admin-only info

### Claude's Discretion
- Exact icon/color choices for the WhatsApp status indicator in the admin list
- Exact formatting of the WhatsApp message in n8n (line breaks, headers, etc.)
- Whether to use a background function, `waitUntil`, or a simple dangling Promise for fire-and-forget in the server action context

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/actions/orders.ts` `createOrder`: webhook call goes here, after line 62 (cart cleared), before `redirect()`
- `orders` table: `whatsapp_sent_at`, `whatsapp_message_id`, `whatsapp_error` columns already exist — just need to be written
- `app/(admin)/admin/orders/page.tsx`: the list page where WhatsApp indicator needs to be added
- `app/(admin)/admin/orders/[id]/page.tsx`: the detail page where sent time / error message needs to surface

### Established Patterns
- Server actions use `createClient()` from `@/lib/supabase/server` for DB operations
- Supabase `.update()` pattern used in `updateOrderStatus` — same pattern for writing `whatsapp_sent_at` / `whatsapp_error`
- Status colors defined in design system: Warning `#F59E0B`, Danger `#EF4444`, Success `#10B981`
- `N8N_WEBHOOK_ORDER_NOTIFICATION` env var already defined

### Integration Points
- `createOrder` in `app/actions/orders.ts` (line 9) is the single integration point for the webhook call
- Admin list and detail pages already query `whatsapp_sent_at` in their selects — UI changes are additive

</code_context>

<specifics>
## Specific Ideas

- Fire-and-forget in a Next.js server action context may need `waitUntil` (from `@vercel/functions`) or a dangling Promise pattern — researcher should confirm the right approach for Vercel
- The retry logic (once after 2s) should be encapsulated in a helper so `createOrder` stays clean

</specifics>

<deferred>
## Deferred Ideas

- Resend/retry button for failed WhatsApp notifications — future phase or admin tooling
- WhatsApp message delivery receipts / read status — out of scope

</deferred>

---

*Phase: 08-order-notifications*
*Context gathered: 2026-04-04*
