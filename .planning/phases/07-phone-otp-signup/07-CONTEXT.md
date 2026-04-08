# Phase 7: Phone OTP Signup - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Create a dedicated /signup page where new users verify their phone number via SMS OTP before their account is activated. Covers: the signup page itself, OTP verification step with 60s resend cooldown, post-verification profile completion, and Sign Up CTAs in the header, login page, and homepage hero.

Login for returning users (/login) is already implemented and is NOT changed except to add a cross-link to /signup.

</domain>

<decisions>
## Implementation Decisions

### Auth Page Separation
- Separate /signup page — distinct from /login, different headline ('Create Account')
- Both pages cross-link: /signup shows "Already have an account? Sign in" → /login; /login shows "New here? Create an account" → /signup
- No guard for existing phone numbers on /signup — same Supabase OTP behavior (existing accounts just get signed in, which is acceptable)
- Visual design matches the existing /login page exactly: dark surface card, red (#E31E24) top accent bar, Space Grotesk font, grid overlay

### Signup Form Flow (3 steps)
1. **Phone step** — collect phone number only before sending OTP (lowest friction to get the SMS out)
2. **OTP step** — enter 6-digit code with visible countdown resend
3. **Profile step** — collect full profile post-verification: company name, street address, city, province, postal code — all required
- No introductory copy above the form — straight to the phone input, same as /login

### Resend Cooldown UX
- Visible countdown timer: button shows "Resend in 47s" counting down live
- On resend: clear the 6-digit OTP input field and show brief "New code sent!" confirmation message
- No custom resend limit — rely on Supabase/Twilio rate limiting

### Entry Points & CTAs
- Sign Up CTA appears in: **header nav**, **/login page** (link below form), **homepage hero**
- Header styling: Sign Up = primary red filled button; Login = ghost/outline — Sign Up is the priority action
- Post-signup redirect (after phone → OTP → profile complete): → /products

### Technology
- Supabase OTP (`supabase.auth.signInWithOtp` + `verifyOtp`) + Twilio — same stack as the existing /login page

### Claude's Discretion
- Exact countdown timer implementation (setInterval vs requestAnimationFrame)
- Loading skeleton or transition between steps
- Exact error message copy for invalid OTP, expired OTP, etc.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/(public)/login/page.tsx`: 3-step OTP flow (phone → otp → profile) — /signup should closely mirror this structure and state machine (`LoginStep` type pattern)
- `components/AuthModal.tsx`: Same OTP flow in modal form — another reference for the step logic
- `components/ui/Input.tsx` + `components/ui/Button.tsx`: Used directly for all form fields and submit buttons
- `app/actions/auth.ts`: `updateProfile` server action handles profile upsert — can be reused in the signup profile step

### Established Patterns
- Phone normalization: `phone.startsWith('+') ? phone : \`+1${phone.replace(/\D/g, '')}\`` — already used in login, reuse in signup
- Step state machine: `useState<'phone' | 'otp' | 'profile'>('phone')` pattern — replicate for signup
- Error display: `<div className="mb-5 p-3 bg-red-50 border border-red-200 text-sm text-red-700">` — consistent error block
- Guest cart merge on auth: login page calls `mergeGuestCart` after auth — signup should do the same

### Integration Points
- `components/Header.tsx` — needs Sign Up button added (primary red) alongside existing Login button
- `app/(public)/page.tsx` (homepage) — needs Sign Up CTA in hero section
- `app/(public)/login/page.tsx` — needs "New here? Create an account → /signup" cross-link added
- `app/middleware.ts` — /signup route should be public (no auth required), verify it's not protected

</code_context>

<specifics>
## Specific Ideas

- The countdown timer should be inline with the resend button text: "Resend in 47s" updating every second, then switching back to "Resend Code" when it hits 0
- The "New code sent!" confirmation should appear briefly (similar to a toast) near the resend button, not as a full error block

</specifics>

<deferred>
## Deferred Ideas

- AUTH-09 (v1.2): Existing accounts prompted to add/verify phone on next login — explicitly out of scope for v1.1, noted in REQUIREMENTS.md

</deferred>

---

*Phase: 07-phone-otp-signup*
*Context gathered: 2026-04-01*
