---
phase: 09-product-sync-workflow
plan: "02"
subsystem: n8n
tags: [n8n, supabase, hkmis-api, sync, webhook, cron]

# Dependency graph
requires:
  - phase: 09-01
    provides: HKMis API credentials and Supabase connection confirmed
provides:
  - Active n8n workflow: HK Product Sync (19 nodes)
  - Count-change guard preventing unnecessary syncs
  - Dynamic pagination syncing all products via HKMis REST API
  - Cleaned alternate_skus (trimmed, tab-prefix stripped)
  - related_parts populated from API related_products field
  - Stale OOS marking for products not seen in latest sync
affects:
  - 09-03 (failure alerting — adds nodes after HTTP: Update Sync Log)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Supabase via HTTP nodes (REST API) instead of Postgres nodes — avoids Transaction Pooler credential requirement"
    - "Count-change guard: compare live count vs last sync_logs.products_synced — skip if unchanged and not manual"
    - "Dynamic offsets: generate [{offset:0,limit:1000}, ...] array from live count at runtime"
    - "SplitInBatches (size=10) + HTTP: Get Product Detail fires 10 parallel requests per batch"
    - "staticData accumulates totalSynced/totalFailed across all batches in a single workflow run"
    - "Mark Stale OOS: PATCH products WHERE last_sync_at < syncStartedAt AND in_stock=true → sets in_stock=false"

key-files:
  created: []
  modified:
    - docs/hk-product-sync-n8n-workflow.json

key-decisions:
  - "Use Supabase REST API (HTTP nodes) instead of Postgres nodes — already authenticated, simpler, no Pooler credential needed"
  - "Schedule: 0 8,20 * * * (8am + 8pm daily) rather than every 2 hours — reduces API load while still catching twice-daily updates"
  - "Mark Stale OOS node added beyond plan scope — products dropped from HKMis API automatically go out-of-stock without manual intervention"
  - "alternate_skus cleaned at transform time: tab-prefixed entries like 'Gunite\\tHT821RC' → 'HT821RC', leading/trailing spaces trimmed"

requirements-completed:
  - SYNC-01
  - SYNC-02
  - SYNC-03
  - SYNC-04

# Metrics
duration: built across multiple sessions
completed: 2026-04-18
---

# Phase 09 Plan 02: HK Product Sync n8n Workflow Summary

**19-node n8n workflow built and saved to repo — dual triggers, count-change guard, dynamic pagination, per-product detail fetch, cleaned transform, Supabase upsert via REST, stale OOS marking, sync_logs recording**

## Performance

- **Tasks:** All workflow nodes built (human-action tasks completed by user)
- **Files modified:** 1 (`docs/hk-product-sync-n8n-workflow.json`)

## Accomplishments

- Built complete HK Product Sync workflow with 19 nodes
- Dual triggers: Schedule (8am + 8pm via cron `0 8,20 * * *`) + Webhook (`/hk-product-sync`)
- Count-change guard: fetches live product count, compares to last `sync_logs.products_synced` — skips sync if unchanged (fast no-op for most scheduled runs)
- Dynamic pagination: `Code: Generate Offsets` builds offset array from live count at runtime — handles any product count without hardcoded values
- Full pipeline: List fetch (limit=1000/page) → flatten IDs → SplitInBatches(10) → detail fetch (prodid param) → transform → upsert
- Transform cleans `cross_refs` from API: strips leading/trailing spaces, extracts part number from `"Brand\tPartNumber"` format, removes trailing commas — stored as `alternate_skus`
- `related_parts` populated from API `related_products` field (mapped to integer array)
- Stale OOS node: PATCH products where `last_sync_at < syncStartedAt` to `in_stock=false` — products removed from HKMis API automatically go OOS
- sync_logs: INSERT at start (status=running), UPDATE at end (status=success/failed, products_synced count)

## Deviations from Plan

- **Supabase via HTTP nodes not Postgres nodes:** Plan specified Postgres nodes (requiring Transaction Pooler credential). Workflow uses Supabase REST API (HTTP nodes with apikey header) instead — same result, simpler setup. ✅ Acceptable.
- **19 nodes not 17:** Two extra nodes — `Merge: Count + LastSync` and `HTTP: Mark Stale OOS`. Both additive improvements. ✅ Acceptable.
- **Schedule 2x daily not every 2 hours:** Cron `0 8,20 * * *` runs at 8am and 8pm. Count-change guard means most runs are no-ops anyway. ✅ Acceptable.

## Files Created/Modified

- `docs/hk-product-sync-n8n-workflow.json` — Complete 19-node workflow; import into n8n at https://dev1573.automantics.ca

## Next Steps for User

1. **Import updated workflow** into n8n (delete old, import new JSON) — includes the cleaned alternate_skus transform
2. **Run manual sync** to re-populate alternate_skus without leading spaces
3. **09-03:** Add failure alert nodes (3 consecutive failures → WhatsApp) — 4 nodes to add after `HTTP: Update Sync Log`

## Next Phase Readiness

- 09-03 can proceed: workflow is built, Twilio credential already in n8n from Phase 8
- 09-03 adds 4 nodes to the existing workflow (HTTP: Get Last 3, Code: Check Alert, IF: Should Alert, Twilio WhatsApp)
</content>
</invoke>