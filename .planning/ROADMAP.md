# Roadmap: HK Trailer Parts

## Milestones

- ✅ **v1.0 Initial Platform** - Phases 1-6 (shipped March 2026)
- 🚧 **v1.1 Core Functionality** - Phases 7-9 (in progress)

## Phases

<details>
<summary>✅ v1.0 Initial Platform (Phases 1-6) - SHIPPED March 2026</summary>

### Phase 1: Foundation
**Goal**: Next.js project scaffolded, Supabase schema live, auth working, product catalog browseable
**Plans**: Complete

### Phase 2: Search
**Goal**: Users can find products by SKU, keyword, and fuzzy match with category/brand filters
**Plans**: Complete

### Phase 3: Cart & Checkout
**Goal**: Guests can add to cart; authenticated users can submit inquiry orders
**Plans**: Complete

### Phase 4: Admin
**Goal**: Admin can view all orders, update statuses, and add internal notes
**Plans**: Complete

### Phase 5: Integrations
**Goal**: n8n/Twilio WhatsApp notifications wired and product sync workflow defined
**Plans**: Complete

### Phase 6: UI Polish
**Goal**: TrailerExplorer, homepage hero, trust signals, and brand design shipped
**Plans**: Complete

</details>

---

### 🚧 v1.1 Core Functionality (In Progress)

**Milestone Goal:** Wire up the three missing production-critical pieces: phone OTP verification on signup, order-to-WhatsApp notification pipeline, and n8n product sync workflow with logging and failure alerts.

- [x] **Phase 7: Phone OTP Signup** - Require new users to verify a phone number via SMS OTP during signup (completed 2026-04-01)
- [ ] **Phase 8: Order Notifications** - Call n8n webhook from createOrder action so admin receives WhatsApp on every new order
- [ ] **Phase 9: Product Sync Workflow** - Build n8n workflow to incrementally sync products from client PHP API to Supabase with logging and failure alerts

## Phase Details

### Phase 7: Phone OTP Signup
**Goal**: New users verify their phone number via SMS OTP before their account is activated
**Depends on**: Phase 6 (v1.0 shipped)
**Requirements**: AUTH-05, AUTH-06, AUTH-07, AUTH-08
**Success Criteria** (what must be TRUE):
  1. The signup form includes a phone number field and will not proceed without one
  2. After submitting the signup form, the user receives a 6-digit SMS on the provided number
  3. Entering the correct OTP completes account creation and signs the user in
  4. If no OTP arrives, the user can request a new one after a 60-second cooldown
  5. Existing accounts created before v1.1 are unaffected and can still log in normally
**Plans**: 2 plans
Plans:
- [ ] 07-01-PLAN.md — Create /signup page with 3-step OTP flow and resend countdown
- [ ] 07-02-PLAN.md — Update header, login cross-link, and homepage CTAs to /signup

### Phase 8: Order Notifications
**Goal**: Admin receives a WhatsApp message with order details within 30 seconds of every new order, and order data is never lost even if the webhook fails
**Depends on**: Phase 7
**Requirements**: NOTIF-01, NOTIF-02, NOTIF-03
**Success Criteria** (what must be TRUE):
  1. After checkout, the createOrder server action sends order number, customer name, phone, and item list to the n8n webhook
  2. Admin's WhatsApp receives a formatted message with full order details within 30 seconds of the order being placed
  3. If the webhook call fails (timeout, n8n down), the order is still saved to Supabase and the error is recorded — no order is lost
**Plans**: 3 plans
Plans:
- [ ] 08-01-PLAN.md — Create lib/notifications.ts helper and wire createOrder to after() + fix getAdminOrders query
- [ ] 08-02-PLAN.md — Update admin orders list with three-state WhatsApp indicator (Sent/Failed/Pending)
- [ ] 08-03-PLAN.md — Configure n8n webhook workflow + Twilio WhatsApp node + end-to-end verification

### Phase 9: Product Sync Workflow
**Goal**: An n8n workflow keeps Supabase products in sync with the client PHP API automatically, with full observability and admin alerts on repeated failures
**Depends on**: Phase 8
**Requirements**: SYNC-01, SYNC-02, SYNC-03, SYNC-04, SYNC-05, SYNC-06
**Success Criteria** (what must be TRUE):
  1. Every 30 minutes, n8n fetches only products updated since the last sync and UPSERTs them to Supabase in batches of 100
  2. A manual trigger in n8n runs a full sync of all products regardless of last-sync timestamp
  3. Every sync run produces a row in the sync_logs table with start time, end time, and counts of products added, updated, and failed
  4. After 3 consecutive failed sync runs, admin receives a WhatsApp alert
  5. A written API contract document specifies the PHP endpoint, request format, response schema, and authentication so the client developer has everything needed to build their side
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | - | Complete | March 2026 |
| 2. Search | v1.0 | - | Complete | March 2026 |
| 3. Cart & Checkout | v1.0 | - | Complete | March 2026 |
| 4. Admin | v1.0 | - | Complete | March 2026 |
| 5. Integrations | v1.0 | - | Complete | March 2026 |
| 6. UI Polish | v1.0 | - | Complete | March 2026 |
| 7. Phone OTP Signup | 2/2 | Complete   | 2026-04-01 | - |
| 8. Order Notifications | 1/3 | In Progress|  | - |
| 9. Product Sync Workflow | v1.1 | 0/? | Not started | - |
