# Gym Owner Portal Implementation Tracker

Last updated: 2026-04-19 (Milestone 6: admin-issued claim links for pre-listed gyms shipped)
Owner: engineering
Status legend: `[x] done`, `[~] partial`, `[ ] not started`, `[-] deferred / future`

This is the canonical tracker for the owner portal rollout. It reflects current implementation status in the codebase and what remains.

## Rollup: milestone status

| Milestone | Theme | Status |
|-----------|--------|--------|
| **0** | Readiness contract (gates, `is_live` decision) | **[x] complete** |
| **1** | Server guards, onboarding backbone, re-auth | **[x] complete** |
| **2** | 8-step wizard, readiness, go-live, dashboard | **[x] complete** |
| **3** | Booking ops, reviews/replies, completeness widget | **[x] complete** |
| **4** | Settings hub + owner security/payouts/notifications baseline | **[x] complete** |
| **5** | Cross-cutting hardening (flags, telemetry, MFA recovery, payout-hold, sign-out-others, tests) | **[x] complete** |
| **6** | Admin-issued claim links for pre-listed gyms (orphan account handoff) | **[x] complete** |

**Product note:** Milestones 1–5 represent the **shipped owner portal**. Remaining work is **product polish** (trusted-devices product surface, in-app message threads), not blocking core flows.

---

## Key reuse points already in-repo

- [x] Client auth gating exists on `/manage` pages via `useAuth()` UX redirects.
- [x] Current onboarding flow exists and writes `gyms` + `gym_images`.
- [x] Existing wizard/edit UI components exist in `components/manage`.
- [x] Stripe Connect state fields exist on `gyms` and are used by owner APIs.
- [x] Booking statuses normalized (`lib/bookings/status-normalization.ts`, migration `033_*`).
- [x] Owner-portal feature flags (`lib/flags/feature-flags.ts`) and telemetry (`lib/telemetry/owner-events.ts`).

---

## Step 0 (prerequisite): Readiness contract

- [x] One-page signed checklist artifact exists (external canonical contract)
  - Source: `/Users/seth/Documents/Business/Combatbooking.com/Documents/combatbooking_readiness_contract.docx`
- [x] **In-repo summary** of the contract — `docs/readiness-contract.md` (referenced from this file).
- [x] **Sign-off decision resolved before Milestone 2C:** go-live state model — Option B using `gyms.is_live`; `verification_status` independent.
- [x] Required go-live gates defined — `lib/onboarding/readiness.ts`.
- [x] Cancellation policy decision codified — optional/recommended with default fallback.
- [x] Gate-to-source mapping + server-side checker — `getGymReadiness(...)`, reused by readiness API, review UI, go-live endpoint, and dashboard nudges.
- [x] Optional/recommended items as nudges only.

---

## Milestone 1: Server guards + onboarding backbone + entry/security gate + shared re-auth

### A) Server-enforced owner guards

- [x] Shared owner server guard helper added — `lib/auth/owner-guard.ts`
- [x] Owner-only server layout added for `/manage/*` — `app/manage/layout.tsx`
- [x] API hardening consistent across owner-mutating owner-portal routes (onboarding, Stripe, booking mutations).
- [x] Regression test scaffolding in place (`__tests__/`, vitest); deeper route-handler integration tests still backlog (Milestone 5 §C).

### B) Dual entry flows + security onboarding

- [x] Self-serve "List your gym" — `app/manage/list-your-gym/page.tsx`, `app/api/onboarding/self-serve/start/route.ts`
- [x] Admin invite accept — `app/manage/invite/[token]/page.tsx`, invite APIs
- [x] Security onboarding + completion API — `app/manage/security-onboarding/page.tsx`, `app/api/onboarding/security/complete/route.ts`

### C) Shared re-auth component + API pattern

- [x] `components/auth/re-auth-dialog.tsx`, `app/api/auth/re-auth/route.ts`, password update + rules

### D) DB lifecycle/invites/security events

- [x] `supabase/migrations/032_owner_portal_backbone.sql`, `lib/types/database.ts`

**Milestone 1 overall: [x] complete**

---

## Milestone 2: Persistent 8-step wizard + readiness review + go-live + dashboard stub

- [x] 8-step model — `lib/onboarding/owner-wizard.ts`
- [x] Wizard routes + state/step APIs — `app/manage/onboarding/[step]/page.tsx`, wizard APIs
- [x] Review route — `app/manage/onboarding/review/page.tsx`
- [x] Legacy 3-step onboarding retired; `/manage/onboarding` redirects to `step-1`
- [x] Single readiness checker — `getGymReadiness(...)` everywhere
- [x] Go-live endpoint + `is_live` — `app/api/onboarding/go-live/route.ts`
- [x] Stripe `account.updated` → `gyms.stripe_connect_verified` — `app/api/webhooks/stripe/route.ts`
- [x] Manage dashboard — `app/manage/page.tsx` (metrics, nudges, today/overview sections)

**Milestone 2 overall: [x] complete**

---

## Milestone 3: Booking ops depth + reviews/replies + completeness widget

### A) Normalize booking statuses

- [x] Migration `033_booking_status_canonical_alignment.sql`, types, `lib/bookings/status-normalization.ts`
- [x] Owner bookings UI + canonical action routes — `app/manage/bookings/page.tsx`

### B)–D) Bookings UI, reviews, completeness

- [x] Filters, CSV export, row actions (pending/confirmed flows); optional polish: dedicated in-app thread vs mailto
- [x] Reviews + reply APIs — `app/manage/reviews/page.tsx`, `app/api/manage/reviews/*`, migration `034_*`
- [x] Dashboard completeness via readiness + `DashboardSetupGuide` / overview on `app/manage/page.tsx`

**Milestone 3 overall: [x] complete** (optional message-thread UX remains non-blocking)

---

## Milestone 4: Settings + ongoing security hardening

### Shipped (baseline complete)

- [x] **Unified settings hub** — `components/manage/manage-settings-page.tsx`
  - Tabs: Personal, Security & login, Communications, Facility / gym management, Payouts.
  - Deep links via `?tab=` and legacy path aliases.
- [x] **Account & credentials**
  - Email change — `app/api/auth/email/update/route.ts`.
  - Password change — `app/api/auth/password/update/route.ts`, `lib/auth/password-rules.ts`.
- [x] **Communications / notification preferences (DB-backed)**
  - `profiles.owner_notification_prefs` — `supabase/migrations/038_*`, `040_*`
  - API — `app/api/manage/settings/notifications/route.ts`
  - UI — `components/manage/settings-communications-section.tsx`, defaults in `lib/manage/owner-notification-prefs.ts`
- [x] **Security section**
  - `components/manage/settings-security-section.tsx`: email/password, optional **TOTP MFA** (`components/manage/mfa-totp-inline-section.tsx`), **MFA recovery codes** (see Milestone 5).
  - Recent security activity surfaced where data exists.
- [x] **Payouts & Stripe**
  - Settings: `components/manage/settings-payouts-section.tsx`.
  - Live balances: `app/manage/balances/page.tsx`, `app/api/stripe/balances/route.ts`.
- [x] **Facility tab** — `components/manage/settings-facility-section.tsx`.

**Milestone 4 overall: [x] complete**

---

## Milestone 5: Cross-cutting hardening + ops/observability

Shipped to close out the previously-deferred backlog with hardening and ops scope (not new owner-journey features).

### A) Feature flags

- [x] `lib/flags/feature-flags.ts` — env-resolved owner-portal flags
  (`security_gate_enforced`, `wizard_persisted_state`, `dashboard_today_chart`,
  `dashboard_overview_metrics`, `mfa_recovery_codes`, `new_device_alerts`,
  `payout_change_hold`, `telemetry_enabled`, `trusted_devices`).
- [x] Flag override pattern: `NEXT_PUBLIC_FLAG_*` (client-readable) and `FLAG_*` (server-only) > defaults.
- [x] Used by recovery-codes routes, record-sign-in route, telemetry emitter.

### B) Telemetry

- [x] `lib/telemetry/owner-events.ts` + table `owner_telemetry_events`
  (`supabase/migrations/043_owner_portal_hardening.sql`, RLS: owner reads own / admin reads all).
- [x] Wired from:
  - `POST /api/onboarding/wizard/step` — `wizard_step_started` / `wizard_step_completed`
  - `GET /api/onboarding/readiness` — `readiness_checked`
  - `POST /api/onboarding/go-live` — `go_live_attempted`, `readiness_failed`, `go_live_succeeded` / `go_live_failed`
  - MFA recovery code routes — `mfa_recovery_codes_generated`, `mfa_recovery_code_consumed`
  - Sign-in recorder — `new_device_sign_in`
  - Password update — `password_changed_signed_out_others`
  - Stripe webhook (external_account changes) — `payouts_hold_activated`

### C) Regression tests

- [x] `vitest` configured (`vitest.config.ts`, `pnpm test`, `pnpm test:watch`).
- [x] `__tests__/password-rules.test.ts` — password validator.
- [x] `__tests__/status-normalization.test.ts` — booking status canonicalization.
- [x] `__tests__/mfa-recovery-codes.test.ts` — recovery code generation + hashing + flags smoke.
- [ ] Future: route-handler integration tests + Playwright E2E for owner-guarded pages, onboarding persistence/resume, booking transitions, and webhook-driven Connect verification. Scaffold lives in `__tests__/README.md`.

### D) Password-reset hardening

- [x] `POST /api/auth/password/update` now invalidates all other refresh tokens for the user (`supabase.auth.signOut({ scope: 'others' })`) by default; opt-out via `sign_out_other_sessions: false` in body.
- [x] Records `security_events.password_changed` with `signed_out_others` metadata; emits `password_changed_signed_out_others` telemetry.

### E) MFA recovery codes

- [x] Migration: `mfa_recovery_codes` table (hashed, salted with `MFA_RECOVERY_PEPPER` env).
- [x] Helpers: `lib/auth/mfa-recovery-codes.ts` (generate / hash, deterministic + casing- and dash-insensitive).
- [x] APIs:
  - `GET /api/auth/mfa/recovery-codes` — remaining count.
  - `POST /api/auth/mfa/recovery-codes` — (re)generate batch (returned plaintext **once**).
  - `POST /api/auth/mfa/recovery-codes/consume` — burn one code (used by sign-in fallback flow).
- [x] UI: recovery-code generation/regeneration block in `components/manage/mfa-totp-inline-section.tsx`, visible once TOTP is verified.

### F) New-device sign-in alerts

- [x] `POST /api/auth/security/record-sign-in` now derives a stable device fingerprint (UA + client_hint, SHA-256) and detects first-time devices against `security_events`.
- [x] On new device: writes `new_device_sign_in` to `security_events` and `owner_telemetry_events`.
- [x] Email path: downstream notification worker can subscribe to `new_device_sign_in` (or Supabase webhook) — table is the integration seam, current build does not auto-email to keep the auth-recording endpoint cheap.

### G) Payout-change hold workflow

- [x] Migration: adds `gyms.payouts_hold_active`, `payouts_hold_reason`, `payouts_hold_set_at`, `payouts_hold_cleared_at`.
- [x] Stripe webhook handles `account.external_account.created/updated/deleted` — sets the hold flag, emits `payouts_hold_activated` telemetry, sends owner email via existing `sendOwnerPayoutDisabledEmail` (re-using template, gated by `email_payouts` notification pref).
- [x] Hold is cleared automatically inside the existing `account.updated` handler when Stripe re-enables payouts.
- [x] **Payouts on hold** UI — shared `components/manage/payouts-hold-banner.tsx` (`balances` + `settings` variants); surfaced on `app/manage/balances/page.tsx` and per-gym in `components/manage/settings-payouts-section.tsx` when `payouts_hold_active`. Balances API returns hold fields from `GET /api/stripe/balances`. Settings deep links use `?tab=payouts` (not hash-only) so the payouts tab opens reliably.

### H) In-repo readiness contract

- [x] `docs/readiness-contract.md` — short contract summary + telemetry expectations.

**Milestone 5 overall: [x] complete (hardening shipped; first-class per-device revoke remains `[-]` per below).**

---

## Milestone 6: Admin-issued claim links for pre-listed gyms

Use case: the platform pre-creates a batch of gyms under a single admin account, then needs to hand each one off to its real owner without putting them through the public onboarding signup. A signed, regeneratable, single-use claim link drops the owner straight into their dashboard, gated by hard/soft prompts (no separate "wizard").

- [x] **Schema** — `supabase/migrations/044_gym_claim_tokens.sql`: `gym_claim_tokens` (gym_id, token_hash, expires_at, claimed_at, revoked_at, created_by) with admin-only RLS, plus `profiles.placeholder_account`, `profiles.claim_password_set`, `profiles.placeholder_email`.
- [x] **Token helpers** — `lib/admin/gym-claim.ts`: 32-byte hex tokens, SHA-256 hash with optional `CLAIM_TOKEN_PEPPER`, deterministic placeholder email builder, randomised placeholder password, expiry helper. Pure module, unit-tested in `__tests__/gym-claim.test.ts`.
- [x] **Admin API — generate / regenerate** — `POST /api/admin/gyms/[id]/claim-link`. On first run for a gym still owned by an admin, creates a synthetic Supabase auth user via service role, seeds the profile (`placeholder_account=true, claim_password_set=false`), and reassigns `gyms.owner_id`. Always revokes any prior active token before minting a new one. Plaintext URL returned ONCE.
- [x] **Admin API — revoke** — `DELETE /api/admin/gyms/[id]/claim-link` revokes any active token without re-issuing.
- [x] **Admin API — list orphans** — `GET /api/admin/orphan-gyms` returns every gym whose owner is still a placeholder, with the latest claim-token state (active / claimed / revoked / expired).
- [x] **Public claim route** — `app/claim/[token]/route.ts`: hashes the URL token, validates against `gym_claim_tokens`, calls `auth.admin.generateLink({ type: 'magiclink' })` for the placeholder email, server-side `verifyOtp` to set cookies, marks the row claimed, redirects to `/manage?claimed=1`.
- [x] **Public failure page** — `app/claim/invalid/page.tsx`: friendly per-reason copy (`expired`, `used`, `revoked`, etc.) without leaking which condition failed.
- [x] **Hard prompt** — `components/manage/account-claim-prompts.tsx` `HardClaimModal`: non-dismissible blocking modal on every `/manage` page until the owner sets a real password (no current-password required because the admin-set one is unknown to them). Optional fields for real email and full name in the same step.
- [x] **Complete-claim API** — `POST /api/manage/account/complete-claim`: gated to `placeholder_account || !claim_password_set`, validates with `validatePasswordRules`, updates auth via service-role `updateUserById`, flips profile flags, records `password_changed` security event + `gym_claim_password_set` / `gym_claim_email_updated` telemetry.
- [x] **Soft prompt** — same component’s `SoftEmailBanner`: surfaces above the manage shell while the auth email still ends in `@claim.combatbooking.local`. Per-session dismiss via `sessionStorage`.
- [x] **Admin UI** — `app/admin/orphan-gyms/page.tsx`: list, filter, generate / regenerate / revoke, copy-to-clipboard for the freshly minted URL (only shown once).
- [x] **Telemetry** — new event types in `lib/telemetry/owner-events.ts`: `gym_claim_link_generated|revoked|redeemed`, `gym_claim_password_set`, `gym_claim_email_updated`.
- [x] **Type updates** — `lib/types/database.ts` `Profile` exposes `placeholder_account`, `claim_password_set`, `placeholder_email`.
- [x] **Tests** — `__tests__/gym-claim.test.ts` covers token generation, hashing determinism, URL building, placeholder email round-trip, password length, expiry futureness.

**Operator runbook (one-time, for the existing 41 pre-listed gyms):**
1. Apply migration 044 (`supabase db push`).
2. In production hosting (Vercel etc.): set `CLAIM_TOKEN_PEPPER` to `openssl rand -hex 32` (≥32 chars; **never rotate after issuing links**). Set `NEXT_PUBLIC_APP_URL` to the canonical prod origin. **If `CLAIM_TOKEN_PEPPER` is missing in production**, claim link generation returns HTTP 503 and redeem shows `/claim/invalid?reason=misconfigured` — enforced in `lib/admin/gym-claim-env.ts` + routes.
3. As an admin user, open `/admin/orphan-gyms` (initially every gym owned by you will appear here once you flip a quick `placeholder_account = true` on those 41 owner rows OR the first claim-link generation will mint a new placeholder owner per gym — recommended path is the latter so the admin account is never the audit trail).
4. Click **Generate claim link** per gym, copy the URL, send via WhatsApp / email to the real owner. Re-issue any time without losing the gym.

**Milestone 6 overall: [x] complete.**

---

## Explicit deferrals (product, not hardening — out of scope for current cycle)

- [x] **Trusted devices (preview copy)** — `components/manage/settings-security-section.tsx`: **Trusted devices** card explains roadmap and links to `#settings-password`; password card documents that other sessions are invalidated on change. Toast uses API field `signed_out_others`.
- [-] **Trusted devices / remember-me** as a first-class product feature with **named device list and per-device revoke** in the UI. Backend table can be added when the UX ships; we still lean on Supabase session model + `signOut({ scope: 'others' })` for bulk sign-out.
- [-] **Remote session revoke UX**: granular per-session revoke (Supabase Auth does not expose a per-session list to authenticated users today). Replaced for now by single "sign out everywhere else" via password change.
- [-] **Custom password-reset hardening beyond Supabase Auth** (e.g. one-time DB-tracked tokens, IP cool-down). Acceptable for current threat model; revisit when GDPR/compliance review begins.
- [-] **Dedicated owner↔guest in-app message thread** (mailto is current UX in `manage/bookings`).

---

## Document maintenance

- When a deferred item ships, move it under the matching shipped section with file references and remove the matching `[-]` line.
- Keep **Last updated** and the **Rollup** table in sync when milestones change.
- Telemetry event vocabulary is authoritative in `lib/telemetry/owner-events.ts` (`OwnerTelemetryEventType`); update there first, then this tracker.
- Feature flag vocabulary is authoritative in `lib/flags/feature-flags.ts` (`OwnerPortalFlag`); same rule.
