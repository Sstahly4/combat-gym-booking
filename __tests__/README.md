# Owner-portal regression tests

Run with:

```
pnpm test
```

Targets pure functions and small server modules that have **no Next/Supabase
runtime dependency**. Add tests here for:

- Route-guard helpers (`lib/auth/owner-guard.ts`) — mock Supabase responses.
- Booking status normalization (`lib/bookings/status-normalization.ts`).
- Password rules (`lib/auth/password-rules.ts`).
- MFA recovery code helpers (`lib/auth/mfa-recovery-codes.ts`).
- Wizard step validation (`lib/onboarding/wizard-api-logic.ts`).
- Owner-portal feature flags (`lib/flags/feature-flags.ts`).

For end-to-end and route-handler tests, prefer Playwright + a Supabase test
project; that scaffold is intentionally **not** in this directory yet — see
the cross-cutting section of `GYM_OWNER_PORTAL_IMPLEMENTATION_TRACKER.md`.
