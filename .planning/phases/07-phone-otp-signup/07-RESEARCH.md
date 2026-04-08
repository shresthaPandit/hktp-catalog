# Phase 7: Phone OTP Signup - Research

**Researched:** 2026-04-01
**Domain:** Supabase Phone OTP Auth / Next.js 15 Client-Side State Machine
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Separate /signup page — distinct from /login, different headline ('Create Account')
- Both pages cross-link: /signup shows "Already have an account? Sign in" → /login; /login shows "New here? Create an account" → /signup
- No guard for existing phone numbers on /signup — same Supabase OTP behavior (existing accounts just get signed in, which is acceptable)
- Visual design matches the existing /login page exactly: dark surface card, red (#E31E24) top accent bar, Space Grotesk font, grid overlay
- Signup Form Flow: 3 steps — (1) Phone step, (2) OTP step with visible countdown resend, (3) Profile step — all profile fields required
- No introductory copy above the form — straight to the phone input, same as /login
- Countdown timer: button shows "Resend in 47s" counting down live; on resend: clear the 6-digit OTP input and show brief "New code sent!" confirmation near the button
- No custom resend limit — rely on Supabase/Twilio rate limiting
- Sign Up CTA appears in: header nav, /login page (link below form), homepage hero
- Header styling: Sign Up = primary red filled button; Login = ghost/outline — Sign Up is the priority action
- Post-signup redirect (after phone → OTP → profile complete): → /products
- Supabase OTP (`supabase.auth.signInWithOtp` + `verifyOtp`) + Twilio — same stack as the existing /login page

### Claude's Discretion
- Exact countdown timer implementation (setInterval vs requestAnimationFrame)
- Loading skeleton or transition between steps
- Exact error message copy for invalid OTP, expired OTP, etc.

### Deferred Ideas (OUT OF SCOPE)
- AUTH-09 (v1.2): Existing accounts prompted to add/verify phone on next login — explicitly out of scope for v1.1, noted in REQUIREMENTS.md
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-05 | New user must provide a phone number during signup | Phone step in 3-step form; mirrors login page pattern exactly |
| AUTH-06 | User receives a 6-digit SMS OTP on provided phone number after submitting signup form | `supabase.auth.signInWithOtp({ phone })` — confirmed pattern from existing /login page |
| AUTH-07 | User must enter the correct OTP to activate their account | `supabase.auth.verifyOtp({ phone, token, type: 'sms' })` — confirmed pattern from existing /login page |
| AUTH-08 | User can request a new OTP if not received (resend after 60-second cooldown) | setInterval countdown timer; call signInWithOtp again on resend; clear OTP field; show "New code sent!" confirmation |
</phase_requirements>

---

## Summary

This phase creates a dedicated `/signup` page that is a close structural mirror of the existing `/login` page (`app/(public)/login/page.tsx`). The auth mechanism — Supabase phone OTP via `signInWithOtp` + `verifyOtp` — is already proven and in production. The implementation is primarily a UI task: copy the login page's 3-step state machine, adjust the headline and copy for signup context, add the 60-second resend countdown to the OTP step, and wire up the three new entry points (header, login page, homepage hero).

The most novel piece is the resend countdown timer, which is a straightforward `setInterval` pattern. Everything else is direct reuse or minor adaptation of existing code. No new database tables, no new API calls, no new environment variables are needed for the auth flow itself.

The one structural gap to resolve: the project has **no root `middleware.ts`**. Only `lib/supabase/middleware.ts` exists as a helper, but there is no `app/middleware.ts` or root-level route guard. This means `/signup` is automatically public — no action needed to exempt it, but the planner should be aware and must NOT introduce a middleware that accidentally blocks the new route.

**Primary recommendation:** Build `app/(public)/signup/page.tsx` as a near-copy of the login page, replacing step labels and adding resend timer logic. Then update three touch points: HeaderControls, login page cross-link, homepage hero CTAs.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | Already installed | `signInWithOtp` + `verifyOtp` for phone OTP | Existing stack; login page already uses this |
| `@supabase/ssr` | Already installed | Server-side Supabase client (middleware helper) | Already in use across project |
| Next.js 15 | Already installed | App Router, Server/Client components | Project framework |
| React `useState` / `useEffect` | Built-in | Step state machine + countdown timer | No external dependency needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `components/ui/Input.tsx` | Local | All form inputs | Already used in login; reuse directly |
| `components/ui/Button.tsx` | Local | Submit + resend buttons | Already used in login; reuse directly |
| `useRouter` / `useSearchParams` | Next.js built-in | Post-auth redirect | Same as login page |
| `mergeGuestCart` from `@/app/actions/cart` | Local | Merge guest cart after auth | Login page already does this; signup must too |
| `useCart` from `@/components/CartProvider` | Local | Access guest cart items | Same pattern as login |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `setInterval` countdown | `requestAnimationFrame` loop | setInterval is simpler and sufficient; rAF is overkill for a 1s tick |
| Inline countdown state | Dedicated `useCountdown` hook | Inline is fine for a single-use countdown; hook adds abstraction with no benefit here |

**Installation:** No new packages needed — all dependencies already present.

---

## Architecture Patterns

### Recommended Project Structure
```
app/
└── (public)/
    ├── login/
    │   └── page.tsx        # EXISTING — add cross-link to /signup
    └── signup/
        └── page.tsx        # NEW — mirrors login page structure

components/
└── HeaderControls.tsx      # EXISTING — add Sign Up button (primary red)

app/(public)/page.tsx       # EXISTING — update hero CTAs
```

### Pattern 1: 3-Step State Machine (direct reuse from login)
**What:** Client component with `useState<'phone' | 'otp' | 'profile'>('phone')` controlling which form renders.
**When to use:** Whenever a multi-step form needs to hold intermediate state (phone number) between steps without a page navigation.
**Example:**
```typescript
// Source: app/(public)/login/page.tsx (existing, verified)
type SignupStep = 'phone' | 'otp' | 'profile'

const [step, setStep] = useState<SignupStep>('phone')
const [phone, setPhone] = useState('')
const [otp, setOtp] = useState('')
const [loading, setLoading] = useState(false)
const [error, setError] = useState('')
```

### Pattern 2: Phone Normalization (reuse verbatim)
**What:** Strip non-digits and prepend +1 for Canadian/US numbers unless user already typed a + prefix.
**When to use:** Before every `signInWithOtp` call.
**Example:**
```typescript
// Source: app/(public)/login/page.tsx (existing, verified)
const normalizedPhone = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`
```

### Pattern 3: Supabase OTP Send + Verify (reuse verbatim)
**What:** `signInWithOtp` sends the SMS; `verifyOtp` with type `'sms'` confirms it.
**Example:**
```typescript
// Source: app/(public)/login/page.tsx (existing, verified)

// Send:
const { error } = await supabase.auth.signInWithOtp({ phone: normalizedPhone })

// Verify:
const { data: { session }, error } = await supabase.auth.verifyOtp({
  phone,
  token: otp,
  type: 'sms',
})
```

### Pattern 4: Post-Auth Guest Cart Merge (reuse verbatim)
**What:** After successful auth, merge any guest cart items into the authenticated user's cart, then clear guest state.
**When to use:** Signup completes auth just like login — guest cart merge must happen.
**Example:**
```typescript
// Source: app/(public)/login/page.tsx (existing, verified)
async function handlePostAuth() {
  if (guestItems.length > 0) {
    await mergeGuestCart(guestItems.map(i => ({ productId: i.productId, quantity: i.quantity })))
    clearGuestCart()
  }
  router.push('/products')
  router.refresh()
}
```

### Pattern 5: 60-Second Resend Countdown (new — Claude's discretion)
**What:** On entering the OTP step, start a 60-second countdown. Button shows "Resend in Xs" while counting; shows "Resend Code" when it hits 0. On click, call `signInWithOtp` again, reset counter to 60, clear OTP field, show brief "New code sent!" message.
**Example:**
```typescript
// setInterval approach — verified pattern, standard React
const [resendSeconds, setResendSeconds] = useState(60)
const [resendMsg, setResendMsg] = useState('')

useEffect(() => {
  if (step !== 'otp') return
  setResendSeconds(60)
  const id = setInterval(() => {
    setResendSeconds(s => {
      if (s <= 1) { clearInterval(id); return 0 }
      return s - 1
    })
  }, 1000)
  return () => clearInterval(id)
}, [step])

async function handleResend() {
  const { error } = await supabase.auth.signInWithOtp({ phone })
  if (!error) {
    setOtp('')
    setResendMsg('New code sent!')
    setResendSeconds(60)
    setTimeout(() => setResendMsg(''), 3000)
  }
}
```

### Pattern 6: Profile Upsert (reuse from login)
**What:** After OTP verification, if `profile.company_name` is empty, show profile step. Profile data is upserted directly via `supabase.from('profiles').upsert(...)`.
**Note:** The existing `updateProfile` server action in `app/actions/auth.ts` does the same thing but with `revalidatePath('/profile')`. For the signup page, the login page's inline client-side upsert approach is simpler and matches the existing pattern. Either works — planner can decide.

### Pattern 7: Header Sign Up Button (update HeaderControls)
**What:** The unauthenticated state in `HeaderControls.tsx` currently shows only a single "Sign In" `btn-primary` link. This needs to become two buttons: Sign Up (primary red filled) + Login (ghost/outline).
**Where to change:** `components/HeaderControls.tsx`, lines 71-73 (the `!profile` branch).
**Example of target shape:**
```tsx
// In the !profile branch of HeaderControls.tsx
<div className="flex items-center gap-2">
  <Link href="/login" className="btn-outline px-4 py-2 text-xs" style={{ fontFamily: 'Space Grotesk' }}>
    Sign In
  </Link>
  <Link href="/signup" className="btn-primary px-5 py-2 text-xs" style={{ fontFamily: 'Space Grotesk' }}>
    Sign Up
  </Link>
</div>
```

### Anti-Patterns to Avoid
- **Don't add root middleware for route protection:** No `middleware.ts` exists at project root. Do not create one as part of this phase — `/signup` is already public by default (it's in `(public)` group). Adding middleware risks breaking existing protected routes.
- **Don't call `signInWithOtp` with `shouldCreateUser: false`:** Default behavior creates or signs in. The "no guard for existing phones" decision means this is intentional.
- **Don't skip guest cart merge:** The login page does it; the signup page must too — users may have browsed and added to guest cart before deciding to sign up.
- **Don't use `updateProfile` server action for the profile step:** It redirects to `/profile` and revalidates that path, which is wrong for the signup flow. Use the inline client-side upsert pattern from login, redirecting to `/products`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SMS OTP delivery | Custom SMS gateway integration | `supabase.auth.signInWithOtp` | Supabase handles Twilio routing, rate limiting, token TTL |
| OTP token validation | Custom token comparison | `supabase.auth.verifyOtp` | Handles token expiry, replay attacks, session creation |
| Session management | JWT cookie logic | Supabase SSR client | Already in `lib/supabase/client.ts` and `server.ts` |
| Profile persistence | Custom API route | `supabase.from('profiles').upsert()` | Direct Supabase client call, already used in login |
| Guest cart merge | Re-implement merge logic | `mergeGuestCart` from `app/actions/cart` | Already implemented and tested in login flow |

---

## Common Pitfalls

### Pitfall 1: Forgetting to reset countdown on step re-entry
**What goes wrong:** User clicks "Use a different number", goes back to phone step, re-enters OTP step — countdown starts from whatever second it was at, not 60.
**Why it happens:** `useEffect` dep array includes `step` but state isn't reset when re-entering.
**How to avoid:** The `useEffect` for the countdown triggers on `step === 'otp'` and explicitly calls `setResendSeconds(60)` at the top before starting the interval. The cleanup function clears the interval.
**Warning signs:** Countdown shows "Resend in 3s" immediately after entering OTP step for the second time.

### Pitfall 2: `setInterval` closure stale state
**What goes wrong:** Countdown reads stale `resendSeconds` value, never decrements correctly.
**Why it happens:** Classic closure trap — the interval callback captures the initial value.
**How to avoid:** Use the functional updater form: `setResendSeconds(s => s - 1)` instead of `setResendSeconds(resendSeconds - 1)`.

### Pitfall 3: Guest cart merge skipped on signup
**What goes wrong:** User adds items as guest, signs up — cart is empty after auth.
**Why it happens:** Developer copies login page but forgets `handlePostAuth()` or `mergeGuestCart` call.
**How to avoid:** Copy `handlePostAuth` verbatim from login. Call it after profile is saved, not after OTP verify (profile step may still be pending).

### Pitfall 4: Profile step redirect goes to wrong route
**What goes wrong:** After profile completion, user lands on `/profile` instead of `/products`.
**Why it happens:** Developer reuses `updateProfile` server action which has `revalidatePath('/profile')` and redirects there.
**How to avoid:** Use inline client-side upsert in signup (not the server action). Then call `router.push('/products')`.

### Pitfall 5: Homepage hero has two "Sign In" CTAs, not a Sign Up CTA
**What goes wrong:** Homepage hero currently has `href="/login"` labelled "Sign In to Order". The phase requires a Sign Up CTA in the hero. Simply changing the label isn't enough — the href must point to `/signup`.
**How to avoid:** Update `app/(public)/page.tsx` hero CTA block: change the ghost button from `/login` → `/signup` and label it "Create Account" or "Sign Up Free". The CTA banner at bottom of page also has a Sign In link — update that too per the decisions.

### Pitfall 6: `Suspense` wrapper required for `useSearchParams`
**What goes wrong:** Build error or runtime error — `useSearchParams()` requires a Suspense boundary in Next.js 15.
**Why it happens:** Next.js 15 App Router requires `useSearchParams` to be wrapped in Suspense.
**How to avoid:** Pattern already established in login page — wrap with `<Suspense>` at the page export level, inner component uses the hook. Reuse this exact pattern for signup page.

---

## Code Examples

Verified patterns from existing codebase:

### Full page scaffold matching login visual design
```typescript
// Source: app/(public)/login/page.tsx (existing, verified)
// Replicate this outer shell exactly for signup:
<div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--surface-alt)' }}>
  {/* Grid overlay */}
  <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
    style={{ backgroundImage: 'repeating-linear-gradient(0deg, #E31E24 0px, #E31E24 1px, transparent 1px, transparent 48px), repeating-linear-gradient(90deg, #E31E24 0px, #E31E24 1px, transparent 1px, transparent 48px)' }}
  />
  <div className="relative w-full max-w-sm">
    {/* Red top accent bar */}
    <div className="h-1 w-full bg-[#E31E24] mb-0" />
    <div className="border border-[#cbd0dd]/30 border-t-0 p-8" style={{ backgroundColor: 'var(--surface-card)' }}>
      {/* Logo + dynamic headline */}
      <div className="mb-8">
        <p className="text-2xl font-black tracking-tighter text-[#E31E24] uppercase mb-1" style={{ fontFamily: 'Space Grotesk' }}>HK</p>
        <h1 className="text-xl font-black uppercase tracking-tight" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface)' }}>
          {step === 'phone' && 'Create Account'}
          {step === 'otp' && 'Enter Code'}
          {step === 'profile' && 'Complete Profile'}
        </h1>
        <p className="text-xs mt-1 uppercase tracking-wide" style={{ color: 'var(--on-surface-dim)', fontFamily: 'Space Grotesk' }}>
          {step === 'phone' && 'Wholesale Parts Portal'}
          {step === 'otp' && `Code sent to ${phone}`}
          {step === 'profile' && 'Required for placing orders'}
        </p>
      </div>
      {/* ... form steps ... */}
    </div>
  </div>
</div>
```

### Error block pattern (reuse verbatim)
```typescript
// Source: app/(public)/login/page.tsx (existing, verified)
{error && (
  <div className="mb-5 p-3 bg-red-50 border border-red-200 text-sm text-red-700">
    {error}
  </div>
)}
```

### Cross-link to add at bottom of phone step form
```tsx
// Add below the "Send Verification Code" button in phone step:
<p className="text-center text-xs mt-4" style={{ color: 'var(--on-surface-dim)', fontFamily: 'Space Grotesk' }}>
  Already have an account?{' '}
  <Link href="/login" className="font-bold text-[#E31E24] hover:underline">Sign in</Link>
</p>
```

### Cross-link to add to existing /login page
```tsx
// Add below the phone step form in login/page.tsx:
<p className="text-center text-xs mt-4" style={{ color: 'var(--on-surface-dim)', fontFamily: 'Space Grotesk' }}>
  New here?{' '}
  <Link href="/signup" className="font-bold text-[#E31E24] hover:underline">Create an account</Link>
</p>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate email signup form | Phone OTP for all auth | Project inception | No email/password in this codebase — phone is the only auth method |
| `middleware.ts` at root | No root middleware (route groups handle protection implicitly) | Project setup | `/signup` in `(public)` group is automatically public — no middleware change needed |

**Deprecated/outdated:**
- Email/password signup: Not used in this project. Supabase email auth is not configured here.

---

## Touch Points Summary

Every file that needs to change in this phase, with specifics:

| File | Change | Scope |
|------|--------|-------|
| `app/(public)/signup/page.tsx` | CREATE — 3-step state machine, mirrors login | New file |
| `components/HeaderControls.tsx` | UPDATE — unauthenticated branch: add Sign Up (primary) + Login (outline) side by side | ~5 lines |
| `app/(public)/login/page.tsx` | UPDATE — add "New here? Create an account → /signup" cross-link below phone form | ~5 lines |
| `app/(public)/page.tsx` | UPDATE — hero ghost button: change href `/login` → `/signup`, label → "Create Account"; CTA banner bottom: same | ~4 lines |

---

## Open Questions

1. **Profile step: client-side upsert vs server action**
   - What we know: Login page uses inline client-side `supabase.from('profiles').upsert()`. The `updateProfile` server action exists but redirects to `/profile` and revalidates that path — wrong for signup flow.
   - What's unclear: Whether to introduce a new server action (e.g., `createProfile`) or keep inline client-side upsert consistent with login.
   - Recommendation: Keep inline client-side upsert for consistency with login — no new server action needed.

2. **Homepage hero: which CTA becomes Sign Up**
   - What we know: Hero currently has two CTAs — "Browse Parts Catalog" (→ /products, primary red) and "Sign In to Order" (→ /login, ghost). The CTA banner at bottom also has "Sign In" (→ /login).
   - What's unclear: Should the hero ghost button become Sign Up, or should a third CTA be added?
   - Recommendation: Replace the ghost "Sign In to Order" button with "Create Account" → /signup. The CTA banner "Sign In" link at the bottom should also become "Sign Up" since it's the conversion moment. The header will have both Login and Sign Up, providing access to /login for returning users.

---

## Sources

### Primary (HIGH confidence)
- `app/(public)/login/page.tsx` — Direct code inspection; all patterns extracted from production implementation
- `components/AuthModal.tsx` — Secondary reference for OTP state machine
- `components/HeaderControls.tsx` — Direct inspection; unauthenticated branch identified
- `app/(public)/page.tsx` — Direct inspection; hero and CTA banner links identified
- `app/actions/auth.ts` — Direct inspection; `updateProfile` behavior confirmed

### Secondary (MEDIUM confidence)
- Supabase docs (from existing codebase usage): `signInWithOtp` + `verifyOtp` with `type: 'sms'` — pattern confirmed by two separate implementations in login page and AuthModal

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and in use
- Architecture: HIGH — primary patterns copied from existing working login page
- Pitfalls: HIGH — identified from direct code inspection of existing implementation
- Touch points: HIGH — all four files read and specific lines identified

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable stack, no external API changes expected)
