---
phase: 07-phone-otp-signup
plan: "02"
subsystem: ui
tags: [next.js, react, navigation, cta, signup]

# Dependency graph
requires:
  - phase: 07-phone-otp-signup
    provides: /signup page with 3-step phone OTP flow (07-01)
provides:
  - Sign Up primary button in header (unauthenticated state) beside Sign In ghost button
  - Cross-link "New here? Create an account" on login page phone step
  - Homepage hero ghost CTA updated to /signup with label "Create Account"
  - Homepage CTA banner button updated to /signup with label "Sign Up"
affects: [08-order-notifications, ui, navigation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Unauthenticated header shows two CTAs: Sign In (outline/ghost) leftmost, Sign Up (primary red) rightmost"
    - "Cross-links between auth flows use red bold Link with hover:underline"

key-files:
  created: []
  modified:
    - components/HeaderControls.tsx
    - app/(public)/login/page.tsx
    - app/(public)/page.tsx

key-decisions:
  - "Sign Up placed to the right of Sign In in header — rightmost position signals primary priority action"
  - "Login page cross-link added inside the phone step form, after the submit button"

patterns-established:
  - "Dual auth header CTAs: btn-outline for Sign In, btn-primary for Sign Up"

requirements-completed: [AUTH-05]

# Metrics
duration: 5min
completed: 2026-04-04
---

# Phase 7 Plan 02: Signup Entry Points Summary

**Sign Up CTA wired into header (primary red), login cross-link, homepage hero, and CTA banner — all four entry points route to /signup, human-verified end-to-end**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-02
- **Completed:** 2026-04-04
- **Tasks:** 2 of 2 (Task 1 auto, Task 2 human-verify — APPROVED)
- **Files modified:** 3

## Accomplishments

- Header unauthenticated state now shows two side-by-side buttons: Sign In (ghost/outline, href=/login) and Sign Up (primary red, href=/signup)
- Login page phone step has a "New here? Create an account" cross-link pointing to /signup
- Homepage hero ghost CTA changed from "Sign In to Order" (/login) to "Create Account" (/signup)
- Homepage CTA banner white button changed from "Sign In" (/login) to "Sign Up" (/signup)
- Human verification confirmed: phone OTP flow (enter number, receive SMS, OTP step with 60s resend countdown), profile completion, redirect to /products, and all four entry points working correctly

## Task Commits

Each task was committed atomically:

1. **Task 1: Update HeaderControls, login cross-link, and homepage CTAs** - `bd3daf4` (feat)
2. **Task 2: Human verify full signup flow** - APPROVED (checkpoint, no code commit)

**Plan metadata:** `21e2e4b` (docs: complete signup entry points plan — checkpoint pending human verify)

## Files Created/Modified

- `components/HeaderControls.tsx` - Replaced single Sign In btn with flex div containing Sign In (outline) + Sign Up (primary) side by side
- `app/(public)/login/page.tsx` - Added `import Link from 'next/link'`, added cross-link paragraph inside phone step form
- `app/(public)/page.tsx` - Hero ghost CTA: href+label to /signup "Create Account"; CTA banner: href+label to /signup "Sign Up"

## Decisions Made

- Sign Up is placed to the right of Sign In in the header — rightmost position = visual emphasis = primary action
- Login cross-link added inside the `<form>` element after the submit button (not outside), matching the interfaces spec exactly

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. TypeScript compiled cleanly and human verification confirmed all entry points and the full OTP signup flow worked end-to-end (phone OTP via Supabase test numbers, resend countdown, profile completion, redirect to /products).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 7 (Phone OTP Signup) fully complete — signup page (07-01) and all entry points (07-02) delivered and verified
- Ready to proceed to Phase 8: Order Notifications (Supabase webhook → n8n → Twilio WhatsApp)
- Blocker: Admin WhatsApp number not yet confirmed — needed to complete Phase 8 end-to-end test

---
*Phase: 07-phone-otp-signup*
*Completed: 2026-04-04*
