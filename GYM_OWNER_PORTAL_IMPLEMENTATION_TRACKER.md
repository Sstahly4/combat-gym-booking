# Gym Owner Portal Implementation Tracker

Last updated: 2026-04-19 (Milestone 4 closure + document completion pass)  
Owner: engineering  
Status legend: `[x] done`, `[~] partial`, `[ ] not started`, `[-] deferred / future`

This is the canonical tracker for the owner portal rollout. It reflects current implementation status in the codebase and what remains.

## Rollup: milestone status

| Milestone | Theme | Status |
|-----------|--------|--------|
| **0** | Readiness contract (gates, `is_live` decision) | **[x] complete** (spec artifact still optional in-repo) |
| **1** | Server guards, onboarding backbone, re-auth | **[x] complete** |
| **2** | 8-step wizard, readiness, go-live, dashboard | **[x] complete** |
| **3** | Booking ops, reviews/replies, completeness widget | **[x] complete** |
| **4** | Settings hub + owner security/payouts/notifications baseline | **[x] complete** |
| **—** | Cross-cutting (flags, telemetry, tests) | **[ ] ongoing** |

**Product note:** Milestones 1–4 represent the **shipped owner portal baseline**. Remaining work is **enhancement and hardening**, not blocking core flows.

---

## Key reuse points already in-repo

- [x] Client auth gating exists on `/manage` pages via `useAuth()` UX redirects.
- [x] Current onboarding flow exists and writes `gyms` + `gym_images`.
- [x] Existing wizard/edit UI components exist in `components/manage`.
- [x] Stripe Connect state fields exist on `gyms` and are used by owner APIs.
- [x] Booking statuses normalized (`lib/bookings/status-normalization.ts`, migration `033_*`).

---

## Step 0 (prerequisite): Readiness contract

- [~] One-page signed checklist artifact exists (external canonical contract)
  - Source: `/Users/seth/Documents/Business/Combatbooking.com/Documents/combatbooking_readiness_contract.docx`
  - Note: canonical artifact exists and is final, but is currently external to repo tracking.
- [x] **Sign-off decision resolved before Milestone 2C:** go-live state model
  - Final decision in readiness contract: **Option B** using `gyms.is_live` as owner go-live state.
  - `verification_status` remains independent for admin trust/verification workflows.
  - Migration shape confirmed: add `is_live BOOLEAN NOT NULL DEFAULT false`; no auto-backfill to live for existing rows.
- [x] Required go-live gates defined
  - Implemented in `lib/onboarding/readiness.ts` (`required[]`, `canGoLive`).
- [x] Cancellation policy decision codified
  - Implemented as optional/recommended readiness item with default fallback behavior.
- [x] Gate-to-source mapping + server-side checker
  - Centralized through `getGymReadiness(...)`, reused by readiness API, review UI, go-live endpoint, and dashboard nudges.
- [x] Optional/recommended items as nudges only
  - Implemented as `optional[]` readiness output, displayed as non-blocking guidance.

**Remaining (non-blocking):**

- [ ] Add a short formal contract artifact (spec/checklist markdown) **in-repo** and reference it from onboarding/readiness code comments and migration notes.

---

## Milestone 1: Server guards + onboarding backbone + entry/security gate + shared re-auth

### A) Server-enforced owner guards

- [x] Shared owner server guard helper added — `lib/auth/owner-guard.ts`
- [x] Owner-only server layout added for `/manage/*` — `app/manage/layout.tsx`
- [x] API hardening consistent across owner-mutating owner-portal routes (onboarding, Stripe, booking mutations). Regression test coverage remains cross-cutting.

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

- [x] **Unified settings hub** — `components/manage/manage-settings-page.tsx` (`ManageSettingsPage`)
  - Tabs: Personal, Security & login, Communications, Facility / gym management, Payouts.
  - Deep links via `?tab=` and legacy path aliases:
    - `app/manage/settings/page.tsx` (hub)
    - `app/manage/settings/security/page.tsx` → security tab
    - `app/manage/settings/notifications/page.tsx` → communications tab
    - `app/manage/settings/payouts/page.tsx` → payouts tab
- [x] **Account & credentials**
  - Email change — `app/api/auth/email/update/route.ts` (with re-auth pattern where required).
  - Password change — `app/api/auth/password/update/route.ts`, `lib/auth/password-rules.ts`.
- [x] **Communications / notification preferences (DB-backed)**
  - `profiles.owner_notification_prefs` — `supabase/migrations/038_owner_notification_prefs.sql`, `040_settings_preferences.sql`
  - API — `app/api/manage/settings/notifications/route.ts`
  - UI — `components/manage/settings-communications-section.tsx`, defaults in `lib/manage/owner-notification-prefs.ts`
- [x] **Security section**
  - `components/manage/settings-security-section.tsx`: email/password, optional **TOTP MFA** via Supabase Auth (`components/manage/mfa-totp-inline-section.tsx` — enroll, verify; recovery documented as email/support path, no separate backup codes in-app).
  - Recent security-related activity surfaced where data exists (event types from backbone).
- [x] **Payouts & Stripe**
  - Settings: `components/manage/settings-payouts-section.tsx` (per-gym Stripe Connect snapshot, links to Connect/onboarding).
  - **Balances (live money movement)** — `app/manage/balances/page.tsx`, `app/api/stripe/balances/route.ts` (owner-guarded Stripe balance + payouts list).
- [x] **Facility tab** — `components/manage/settings-facility-section.tsx` (gym-scoped management entry points).

### Deferred / future hardening (not required for M4 closure)

These are **explicitly out of scope** for the milestone-4 “baseline complete” decision; track as product/security backlog.

- [-] **Trusted devices / remember-me** as a first-class product feature (beyond Supabase session defaults).
- [-] **New-device alerts** + **remote session revoke** UX (beyond current security event surfacing).
- [-] **Payout-change hold workflow** + owner notifications (e.g. delayed-notification pipeline when bank details change) — partial hooks may exist (`payout_disabled_notified_at` on gyms); full workflow TBD.
- [-] **Custom password-reset hardening** (single-use tokens, global session invalidation) — platform relies on **Supabase Auth** reset flows unless we add app-layer policy later.
- [-] **Standalone MFA recovery codes** — app documents email recovery; Supabase TOTP only unless we add backup codes product-wide.

**Milestone 4 overall: [x] complete (baseline + shipped settings/MFA/notifications/balances)**

---

## Cross-cutting: flags, telemetry, regression tests

- [ ] Feature gates (env/DB) for security gate, wizard enforcement, dashboard widgets
- [ ] Telemetry for step completion, abandonment, readiness failures, go-live conversion
- [ ] Regression tests for:
  - role/ownership route guards
  - onboarding persistence/resume
  - booking actions/status transitions
  - webhook-driven Stripe Connect verification

---

## Prioritized next actions (post–Milestone 4)

1. **In-repo readiness contract** (short markdown) linked from `getGymReadiness` / onboarding docs.
2. **Cross-cutting:** feature flags, telemetry, automated regression tests (see section above).
3. **Optional product polish:** dedicated owner↔guest message thread in manage bookings (mailto is current).
4. **Milestone 4 deferred backlog:** trusted-device UX, new-device alerts, payout-change hold notifications, custom reset policy, backup recovery codes — prioritize with security/product.

---

## Document maintenance

- When a deferred item ships, move it under Milestone 4 “Shipped” with file references and remove the matching `[-]` line.
- Keep **Last updated** and the **Rollup** table in sync when milestones change.
