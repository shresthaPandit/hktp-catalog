---
phase: 07-phone-otp-signup
plan: 01
subsystem: auth
tags: [supabase, otp, sms, phone-auth, next.js, react]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Supabase auth client, CartProvider, mergeGuestCart action, Button/Input UI components
provides:
  - /signup route with 3-step phone OTP flow (phone -> OTP -> profile -> /products)
  - Resend countdown timer with 60s cooldown and 'New code sent!' feedback
  - Guest cart merge on signup completion
affects: [header, login, middleware, checkout]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "3-step form flow with step state: phone | otp | profile"
    - "useEffect-based countdown timer with functional updater to avoid stale closure"
    - "Inline client-side Supabase profile upsert for signup (avoids server action redirect)"

key-files:
  created:
    - app/(public)/signup/page.tsx
  modified: []

key-decisions:
  - "No Suspense wrapper on SignupPage — signup has no useSearchParams usage, omitted to keep clean"
  - "Signup always redirects to /products after completion — no searchParams redirect param"
  - "Guest cart merge called in handlePostAuth after profile save, matching login pattern"

patterns-established:
  - "Resend countdown: useEffect triggered by step === 'otp', functional updater setResendSeconds(s => s - 1)"
  - "Phone normalization: phone.startsWith('+') ? phone : '+1' + phone.replace(/\D/g, '')"

requirements-completed: [AUTH-05, AUTH-06, AUTH-07, AUTH-08]

# Metrics
duration: 5min
completed: 2026-04-02
---

# Phase 7 Plan 01: Phone OTP Signup Summary

**3-step phone OTP signup flow (phone -> SMS OTP -> profile) via Supabase signInWithOtp/verifyOtp with 60s resend countdown and guest cart merge**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-02T12:03:13Z
- **Completed:** 2026-04-02T12:08:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created `app/(public)/signup/page.tsx` with complete 3-step OTP signup flow
- Resend countdown timer (60s) with live display "Resend in Xs", enables at 0, shows "New code sent!" for 3s after resend
- Guest cart merges into authenticated cart after profile save, then redirects to /products

## Task Commits

Each task was committed atomically:

1. **Task 1: Create signup page with 3-step OTP flow and resend countdown** - `5e52f1e` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `app/(public)/signup/page.tsx` - 3-step signup: phone entry -> OTP verify with resend countdown -> profile completion (company, address, city, province, postal code)

## Decisions Made
- No Suspense wrapper needed — signup page has no `useSearchParams` usage unlike login, omitted to keep component clean
- Signup always lands on `/products` — no redirect parameter support per plan spec
- Used inline `supabase.from('profiles').upsert()` rather than `updateProfile` server action (server action redirects to /profile, wrong for signup flow)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None. TypeScript compiled cleanly on first attempt.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- /signup route fully functional end-to-end
- Header can now show Sign Up / Sign In links side-by-side (HeaderControls.tsx not modified in this plan — separate task if needed)
- Phase 8 (Order Notifications) can proceed; this phase does not block it

---
*Phase: 07-phone-otp-signup*
*Completed: 2026-04-02*
