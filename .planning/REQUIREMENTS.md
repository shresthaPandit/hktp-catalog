# Requirements: HK Trailer Parts

**Defined:** 2026-03-31
**Core Value:** Customers can find and inquire about parts fast — catalog must be browsable, searchable, and order flow must work end-to-end without friction.

## v1.1 Requirements

Requirements for milestone v1.1. Each maps to roadmap phases.

### Authentication

- [x] **AUTH-05**: New user must provide a phone number during signup
- [x] **AUTH-06**: User receives a 6-digit SMS OTP on provided phone number after submitting signup form
- [x] **AUTH-07**: User must enter the correct OTP to activate their account
- [x] **AUTH-08**: User can request a new OTP if not received (resend after 60-second cooldown)

### Order Notifications

- [x] **NOTIF-01**: After an order is placed, system calls the n8n webhook with order number, customer name, phone, and item list
- [x] **NOTIF-02**: Admin receives WhatsApp message with order details within 30 seconds of order placement
- [x] **NOTIF-03**: If n8n webhook call fails, order is still saved and error is logged (no order loss)

### Product Sync

- [ ] **SYNC-01**: n8n workflow fetches products from client PHP API every 30 minutes (incremental — only products updated since last sync)
- [ ] **SYNC-02**: Full sync available via manual n8n trigger (ignores last-sync timestamp, refreshes all products)
- [ ] **SYNC-03**: Products are UPSERTed to Supabase by SKU in batches of 100
- [ ] **SYNC-04**: Each sync run is logged to `sync_logs` table (start time, end time, products added/updated/failed counts)
- [ ] **SYNC-05**: After 3 consecutive failed syncs, admin receives WhatsApp alert
- [ ] **SYNC-06**: Client PHP API contract is documented (endpoint spec, request/response format, authentication) so client developer knows exactly what to build

## v1.2 Requirements

Deferred — pending client confirmation.

### Loyalty

- **LOYAL-01**: User earns points for each order placed
- **LOYAL-02**: User can view their point balance in their account
- **LOYAL-03**: User can redeem points for a discount at checkout
- **LOYAL-04**: Admin can view and manually adjust customer point balances

### Authentication Backfill

- **AUTH-09**: Existing accounts (pre-v1.1) are prompted to add and verify phone on next login

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time chat | High complexity, not core to inquiry workflow |
| Mobile app | Web-first |
| OAuth / social login | Email + phone sufficient |
| Payment processing | Inquiry-based workflow — no transactions |
| Phone OTP for existing users | v1.2 scope, not v1.1 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-05 | Phase 7 | Complete |
| AUTH-06 | Phase 7 | Complete |
| AUTH-07 | Phase 7 | Complete |
| AUTH-08 | Phase 7 | Complete |
| NOTIF-01 | Phase 8 | Complete |
| NOTIF-02 | Phase 8 | Complete |
| NOTIF-03 | Phase 8 | Complete |
| SYNC-01 | Phase 9 | Pending |
| SYNC-02 | Phase 9 | Pending |
| SYNC-03 | Phase 9 | Pending |
| SYNC-04 | Phase 9 | Pending |
| SYNC-05 | Phase 9 | Pending |
| SYNC-06 | Phase 9 | Pending |

**Coverage:**
- v1.1 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-31*
*Last updated: 2026-03-31 — traceability updated after v1.1 roadmap creation*
