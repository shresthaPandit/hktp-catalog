# Phase 8: Order Notifications - Research

**Researched:** 2026-04-04
**Domain:** Next.js server action side-effects, n8n webhook integration, Supabase DB writes
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Fire-and-forget — do NOT await the webhook call; customer redirect happens immediately
- 5-second timeout on the fetch call
- Retry once after 2 seconds if the first attempt fails (any non-200 or timeout)
- If both attempts fail, continue — order is the priority, webhook failure is non-fatal
- Webhook is called after the DB insert succeeds and cart is cleared
- On failure: write `"{HTTP status}: {error message}"` (e.g. `"HTTP 503: Service Unavailable"` or `"Timeout after 5s"`) to `whatsapp_error` column
- Only the final failure is recorded (not both attempts)
- On success (200 response): write the current timestamp to `whatsapp_sent_at`, leave `whatsapp_error` null
- No resend button or retry UI in this phase — admin handles manually via WhatsApp if needed
- WhatsApp message content includes: order number, customer company name, customer phone, full item list (name + qty + price per item), subtotal, customer notes if present
- No truncation for large orders — show all items
- Orders list: small WhatsApp status indicator per row showing sent/failed
- Failed rows: subtle warning indicator (icon or color) so admin notices at a glance
- Order detail page: show sent timestamp if success, or error message if failed
- Customer-facing pages: no WhatsApp status shown — admin-only info

### Claude's Discretion
- Exact icon/color choices for the WhatsApp status indicator in the admin list
- Exact formatting of the WhatsApp message in n8n (line breaks, headers, etc.)
- Whether to use a background function, `waitUntil`, or a simple dangling Promise for fire-and-forget in the server action context

### Deferred Ideas (OUT OF SCOPE)
- Resend/retry button for failed WhatsApp notifications — future phase or admin tooling
- WhatsApp message delivery receipts / read status — out of scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NOTIF-01 | After an order is placed, system calls the n8n webhook with order number, customer name, phone, and item list | `after()` pattern in `createOrder` action; webhook payload structure |
| NOTIF-02 | Admin receives WhatsApp message with order details within 30 seconds of order placement | n8n webhook → Twilio node wiring; `N8N_WEBHOOK_ORDER_NOTIFICATION` env var already defined |
| NOTIF-03 | If n8n webhook call fails, order is still saved and error is logged (no order loss) | `after()` isolates webhook from order transaction; Supabase `.update()` writes `whatsapp_error` |
</phase_requirements>

---

## Summary

Phase 8 has a narrow, well-defined scope: wire the existing `createOrder` server action to call an n8n webhook after a successful order insert, and surface WhatsApp delivery status in the existing admin UI. No new pages, no new tables — only additive changes to one server action, one helper utility, and two admin UI files.

The critical technical question — how to correctly fire-and-forget in a Next.js 15 server action on Vercel — has a verified answer: use `after()` from `next/server`. This was stabilized in Next.js 15.1 (December 2024) and is fully available in this project's Next.js 16.1.6. `after()` uses Vercel's `waitUntil()` primitive under the hood, which extends the serverless function's lifetime until all scheduled callbacks settle. A dangling Promise (the naive `void fetch(...)` pattern) is unreliable on Vercel because the function container can be reaped immediately after the response is sent, silently dropping the fetch.

The admin UI already has 90% of the structure in place. The orders list page already has a "WhatsApp" column header and renders `whatsapp_sent_at` (lines 80 and 104-107 of `page.tsx`). The detail page already shows sent time and error in the Customer Information card (lines 101-109). The gaps are: (1) the list page query does not fetch `whatsapp_error`, so it cannot distinguish "pending" from "failed" — it needs `whatsapp_error` added to `getAdminOrders`; (2) the list page shows "Pending" for any row where `whatsapp_sent_at` is null, even if there is an error.

**Primary recommendation:** Use `after()` from `next/server` for fire-and-forget. Encapsulate retry logic in `lib/notifications.ts`. Keep `createOrder` clean — it calls one helper and `after()` handles the rest asynchronously.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next/server` `after()` | built-in (Next.js 16.x) | Schedule work after response is sent | Stable since Next.js 15.1; uses Vercel `waitUntil` under the hood; no extra install |
| `@supabase/ssr` (existing) | ^0.9.0 | Write `whatsapp_sent_at` / `whatsapp_error` back to orders table | Already used throughout the project |
| Node.js `fetch` + `AbortController` | built-in | HTTP call to n8n webhook with timeout | No extra dependency; AbortController is the standard timeout pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@vercel/functions` `waitUntil` | latest | Lower-level primitive that `after()` wraps | Only needed if NOT using Next.js — skip for this project |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `after()` from `next/server` | Dangling Promise (`void fetch(...)`) | Dangling Promise is silently killed when Vercel function exits — not safe for production |
| `after()` from `next/server` | `@vercel/functions` `waitUntil` directly | Works, but `after()` is the official Next.js abstraction and is stable; no reason to use lower-level API |

**Installation:** No new packages needed. `after` is from `next/server` (already a dependency).

---

## Architecture Patterns

### Recommended File Structure
```
app/
├── actions/
│   └── orders.ts           # Add after() call + whatsapp DB update
lib/
├── notifications.ts        # NEW: sendOrderNotification() helper with retry logic
```

The webhook logic lives in `lib/notifications.ts` — not inline in `orders.ts`. This keeps `createOrder` clean and makes the retry logic independently testable.

### Pattern 1: after() for Fire-and-Forget in Server Actions

**What:** Schedule a callback to run after the response (or redirect) is sent. The Vercel function stays alive until the callback resolves.

**When to use:** Any side effect that must not delay the user response but must complete before the function exits — logging, analytics, webhook calls.

**Constraint:** `after()` callbacks CANNOT call `redirect()`, `notFound()`, or mutate cookies/headers — response is already finalized. Reading `cookies()` or `headers()` inside the callback is supported only in server actions and route handlers (not server components); but we do not need these here.

**Constraint:** `after()` must be called synchronously inside the server action — not inside the callback itself.

```typescript
// Source: https://nextjs.org/blog/next-15-1#after-stable (verified, HIGH confidence)
import { after } from 'next/server'

export async function createOrder(fd: FormData): Promise<void> {
  // ... DB insert, cart clear ...

  // Called synchronously — schedules work BEFORE redirect()
  after(async () => {
    await sendOrderNotification(order.id, order.order_number, orderPayload)
  })

  redirect(`/orders/${order.order_number}`)
}
```

**Key behavior:** `after()` is called before `redirect()` — that is correct. `redirect()` throws internally, which Next.js catches. The `after()` callback still executes.

### Pattern 2: Webhook Helper with Timeout + Retry

**What:** Encapsulate the fetch call, AbortController timeout, single retry, and DB write in one function.

**When to use:** Any time you call an external webhook from a server action.

```typescript
// Source: MDN AbortController + project pattern (MEDIUM confidence)
// lib/notifications.ts

import { createClient } from '@/lib/supabase/server'

export async function sendOrderNotification(
  orderId: number,
  orderNumber: string,
  payload: OrderNotificationPayload
): Promise<void> {
  const webhookUrl = process.env.N8N_WEBHOOK_ORDER_NOTIFICATION
  if (!webhookUrl) return  // env var not set → skip silently

  const attemptFetch = async (): Promise<{ ok: boolean; error?: string }> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (res.ok) return { ok: true }
      const text = await res.text().catch(() => '')
      return { ok: false, error: `HTTP ${res.status}: ${text || res.statusText}` }
    } catch (err) {
      clearTimeout(timeoutId)
      if ((err as Error).name === 'AbortError') {
        return { ok: false, error: 'Timeout after 5s' }
      }
      return { ok: false, error: `HTTP 0: ${(err as Error).message}` }
    }
  }

  let result = await attemptFetch()

  if (!result.ok) {
    // Retry once after 2 seconds
    await new Promise(r => setTimeout(r, 2000))
    result = await attemptFetch()
  }

  // Write outcome to orders table (same Supabase pattern as updateOrderStatus)
  const supabase = await createClient()
  if (result.ok) {
    await supabase
      .from('orders')
      .update({ whatsapp_sent_at: new Date().toISOString(), whatsapp_error: null })
      .eq('id', orderId)
  } else {
    await supabase
      .from('orders')
      .update({ whatsapp_error: result.error })
      .eq('id', orderId)
  }
}
```

### Pattern 3: n8n Webhook Payload Structure

**What:** The JSON body sent to `N8N_WEBHOOK_ORDER_NOTIFICATION`.

**When to use:** n8n Webhook node receives `application/json` and auto-parses the body.

```typescript
// Payload type definition
interface OrderNotificationPayload {
  order_number: string        // e.g. "ORD-2026-00042"
  company_name: string        // customer's company
  phone: string               // customer's phone
  items: Array<{
    name: string
    quantity: number
    price_at_order: number | null
    subtotal: number | null   // price_at_order * quantity (null if price unknown)
  }>
  subtotal: number            // sum of all item subtotals (items with null price contribute 0)
  customer_notes: string | null
  placed_at: string           // ISO timestamp of order creation
}
```

n8n receives this as `$json.body.order_number`, `$json.body.items`, etc. (standard n8n webhook body access pattern).

### Pattern 4: Admin List — WhatsApp Status Indicator

**What:** Three states for each row: sent (green), failed (red/warning), pending (neutral).

**Current gap:** `getAdminOrders` fetches `whatsapp_sent_at` but NOT `whatsapp_error`. Must add `whatsapp_error` to the select.

```typescript
// In getAdminOrders (app/actions/orders.ts line 125)
// Change:
.select('id, order_number, user_id, status, total_items, created_at, customer_info, whatsapp_sent_at')
// To:
.select('id, order_number, user_id, status, total_items, created_at, customer_info, whatsapp_sent_at, whatsapp_error')
```

Three-state indicator (Claude's discretion for exact style, anchored to design system colors):
- `whatsapp_sent_at` is set → green "Sent" (already exists)
- `whatsapp_error` is set → red/warning "Failed" (Warning `#F59E0B` or Danger `#EF4444`)
- Neither → grey "Pending" (unchanged)

### Anti-Patterns to Avoid

- **Dangling Promise:** `void fetch(webhookUrl, ...)` — unreliable on Vercel. The function exits when `redirect()` is reached and the fetch may never complete.
- **Awaiting the webhook before redirect:** Violates the fire-and-forget requirement. Adds latency to checkout.
- **Wrapping createOrder in try/catch around the webhook:** Webhook failure must never propagate to the user. All throws inside the `after()` callback are swallowed (they log to server-side console only).
- **Calling createClient() before after():** `createClient()` inside the `after()` callback is fine for server actions. Do NOT reuse the outer `supabase` instance across the `after()` boundary — create a fresh one inside the callback.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Background task scheduling | Custom job queue, database-backed retry table | `after()` from `next/server` | Stable, Vercel-aware, zero infrastructure |
| Webhook timeout | Manual race with setTimeout | `AbortController` + `signal` | Standard fetch API; handles all edge cases including network drops |

**Key insight:** The entire "fire-and-forget reliably on serverless" problem is solved by `after()`. There is no need for queues, background workers, or database-backed retry tables for a single-attempt-with-one-retry webhook call.

---

## Common Pitfalls

### Pitfall 1: Dangling Promise Silently Dropped on Vercel

**What goes wrong:** `void sendOrderNotification(...)` or an unregistered Promise starts but gets garbage collected when Vercel's function container exits post-redirect. No error, no log — the webhook just never fires.

**Why it happens:** Vercel serverless functions are shut down immediately after the response is finalized (the HTTP response, or a `redirect()`). Any pending async work not registered with `waitUntil` is abandoned.

**How to avoid:** Always use `after()` to register the background work. `after()` calls Vercel's `waitUntil()` internally, keeping the function alive until the callback settles.

**Warning signs:** Webhook fires reliably in local dev (`next dev`) but intermittently or never in Vercel production.

### Pitfall 2: `after()` Called Inside the Callback (Nested)

**What goes wrong:** Calling `after()` inside the async callback passed to `after()` — this is not supported.

**Why it happens:** Misreading the API as recursive.

**How to avoid:** `after()` is called synchronously in the server action body, scheduling one callback. The callback itself is async but does not call `after()` again.

### Pitfall 3: createClient Reuse Across after() Boundary

**What goes wrong:** The `supabase` client created at the top of `createOrder` may have its request context invalidated after the response is sent. Using it inside `after()` can cause auth/session errors.

**Why it happens:** Supabase SSR client captures request headers at construction time.

**How to avoid:** Call `await createClient()` freshly inside the `after()` callback (or inside `sendOrderNotification`).

### Pitfall 4: Missing whatsapp_error in getAdminOrders Query

**What goes wrong:** Admin list page cannot distinguish "failed" from "pending" — both show as "Pending" since `whatsapp_sent_at` is null for both states.

**Why it happens:** `getAdminOrders` currently selects `whatsapp_sent_at` but not `whatsapp_error` (line 125 in `orders.ts`).

**How to avoid:** Add `whatsapp_error` to the select in `getAdminOrders`. Also add it to the `CustomerOrderRow` type or a new `AdminOrderRow` type.

### Pitfall 5: after() Errors Silently Logged, Not Surfaced

**What goes wrong:** If `sendOrderNotification` itself throws unexpectedly (not a handled fetch error), Next.js logs it server-side but the customer sees nothing and no error is written to DB.

**Why it happens:** `after()` callbacks are isolated from the response — errors inside them are caught and logged but do not propagate.

**How to avoid:** Wrap the body of the `after()` callback in a top-level try/catch. In the catch, write the error string to `whatsapp_error`. This ensures all failure paths produce a DB record.

---

## Code Examples

### Verified: after() in server action with redirect

```typescript
// Source: https://nextjs.org/blog/next-15-1 (HIGH confidence — official release notes)
// after() is called BEFORE redirect(). redirect() throws internally,
// but after() callbacks are still executed.

import { after } from 'next/server'

export async function createOrder(fd: FormData): Promise<void> {
  // ... DB work ...

  after(async () => {
    // This runs after the redirect response is sent to the client
    await sendOrderNotification(order.id, order.order_number, payload)
  })

  redirect(`/orders/${order.order_number}`)
}
```

### Verified: AbortController 5-second timeout pattern

```typescript
// Source: MDN fetch + AbortController (HIGH confidence — web standard)
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 5000)
try {
  const res = await fetch(url, { signal: controller.signal })
  clearTimeout(timeoutId)
  // handle response
} catch (err) {
  clearTimeout(timeoutId)
  if ((err as Error).name === 'AbortError') {
    // timeout hit
  }
}
```

### Verified: Supabase update pattern (matches existing codebase)

```typescript
// Source: app/actions/orders.ts lines 165-180 (updateOrderStatus pattern)
// Same pattern, same supabase client usage
const supabase = await createClient()
await supabase
  .from('orders')
  .update({ whatsapp_sent_at: new Date().toISOString(), whatsapp_error: null })
  .eq('id', orderId)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `unstable_after` (experimental, needed config flag) | `after()` from `next/server` (stable, no config needed) | Next.js 15.1, Dec 2024 | No next.config.js change required; stable API |
| Dangling Promise (`void fetch(...)`) | `after()` using Vercel `waitUntil` | Next.js 15.1, Dec 2024 | Reliable completion on serverless |
| `@vercel/functions` `waitUntil` directly | `after()` from `next/server` | Next.js 15.1, Dec 2024 | Official Next.js abstraction, no extra package |

**Deprecated/outdated:**
- `unstable_after`: import alias still works for backward compat but use `after` directly — no `unstable_` prefix needed

---

## Open Questions

1. **Admin WhatsApp number not confirmed**
   - What we know: `TWILIO_WHATSAPP_TO` env var is defined in CLAUDE.md as a reference; the actual value is in n8n's environment
   - What's unclear: Whether the production admin WhatsApp number is configured in n8n Cloud yet (STATE.md explicitly flags this as a blocker)
   - Recommendation: This does not block implementation. The n8n workflow and the Next.js webhook call can be built and tested with a placeholder/test number. Mark end-to-end WhatsApp test as a manual verification step pending phone confirmation.

2. **n8n webhook URL known vs placeholder**
   - What we know: `N8N_WEBHOOK_ORDER_NOTIFICATION` env var is in CLAUDE.md but the actual URL value depends on the n8n Cloud workflow being created
   - What's unclear: Whether the n8n workflow for this webhook exists yet or needs to be created as part of this phase
   - Recommendation: Phase 8 should include creating/verifying the n8n webhook workflow. The `.env.local` URL is set after creating the webhook node in n8n Cloud. This is a required task in the plan.

---

## Sources

### Primary (HIGH confidence)
- https://nextjs.org/blog/next-15-1 — Official release blog confirming `after()` stable, December 2024
- `app/actions/orders.ts` (project source) — Integration point, existing patterns
- `app/(admin)/admin/orders/page.tsx` (project source) — Current WhatsApp column structure
- `app/(admin)/admin/orders/[id]/page.tsx` (project source) — Current WhatsApp detail display

### Secondary (MEDIUM confidence)
- https://vercel.com/changelog/waituntil-is-now-available-for-vercel-functions — Vercel `waitUntil` primitive that `after()` uses
- https://nextjs.org/docs/app/api-reference/functions/after — Official after() API reference (content not directly accessible but confirmed via search results referencing stable status)
- https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/ — n8n webhook node docs (payload format)

### Tertiary (LOW confidence)
- Community posts confirming dangling Promise risk on Vercel serverless — consistent with official docs but not directly quoted

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — `after()` stable status confirmed from official Next.js 15.1 release blog
- Architecture: HIGH — patterns derived from existing codebase + verified API behavior
- Pitfalls: HIGH for `after()` behavior; MEDIUM for Supabase client reuse across boundary (verified from known SSR client design)

**Research date:** 2026-04-04
**Valid until:** 2026-05-04 (Next.js API stable; Vercel function behavior stable)
