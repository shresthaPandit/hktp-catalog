---
phase: 08-order-notifications
plan: "01"
subsystem: notifications
tags: [webhook, n8n, whatsapp, after, fire-and-forget, orders]
dependency_graph:
  requires: []
  provides: [sendOrderNotification, OrderNotificationPayload]
  affects: [app/actions/orders.ts, lib/notifications.ts]
tech_stack:
  added: [after() from next/server]
  patterns: [fire-and-forget via after(), AbortController fetch timeout, retry with delay, best-effort DB write]
key_files:
  created:
    - lib/notifications.ts
  modified:
    - app/actions/orders.ts
decisions:
  - "after() used for fire-and-forget — webhook runs post-redirect without blocking customer"
  - "Webhook URL guard (silent skip if env var not set) enables local dev without n8n"
  - "Inline type annotations added to map/reduce callbacks to satisfy strict TSC in noImplicitAny mode"
metrics:
  duration: "~2 min"
  completed_date: "2026-04-07"
  tasks_completed: 2
  files_modified: 2
---

# Phase 8 Plan 01: Webhook Notification Helper Summary

**One-liner:** Fire-and-forget n8n webhook on every order via after(), with 5s timeout, single retry, and DB-recorded outcome.

## What Was Built

Created `lib/notifications.ts` with `sendOrderNotification()` that:
- Guards on `N8N_WEBHOOK_ORDER_NOTIFICATION` env var — silent skip if unset (dev-safe)
- POSTs order payload to n8n webhook with 5-second AbortController timeout
- Handles three error classes: AbortError ("Timeout after 5s"), non-200 ("HTTP {status}: {text}"), network error ("HTTP 0: {message}")
- Retries once after 2000ms on first failure
- On success: writes `whatsapp_sent_at` ISO timestamp, clears `whatsapp_error`
- On final failure: writes error string to `whatsapp_error`, leaves `whatsapp_sent_at` null
- Top-level try/catch ensures no exception ever escapes to the caller

Wired into `app/actions/orders.ts`:
- Imports `after` from `next/server` and `sendOrderNotification` from `lib/notifications`
- Builds `OrderNotificationPayload` after cart clear, before redirect
- Calls `after()` synchronously in server action body — Vercel keeps function alive post-redirect
- Added `whatsapp_error` to `getAdminOrders` select query for three-state UI in plan 08-02

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | e3886c5 | feat(08-01): create sendOrderNotification helper |
| Task 2 | 8fbddd3 | feat(08-01): wire after() + fix getAdminOrders query |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Implicit any types in payload map/reduce callbacks**
- **Found during:** Task 2 TypeScript compilation
- **Issue:** `items.map(i => ...)` and `items.reduce((sum, i) => ...)` failed with TS7006 (implicit any) because the `items` array's element type wasn't automatically inferred in those inline callbacks
- **Fix:** Added explicit inline type annotations to each callback parameter
- **Files modified:** app/actions/orders.ts
- **Commit:** 8fbddd3 (included in task commit)

## Self-Check: PASSED

- lib/notifications.ts: FOUND
- after() in orders.ts: FOUND
- whatsapp_error in orders.ts: FOUND
- TSC: PASS (0 errors)
- Commits e3886c5, 8fbddd3: verified in git log
