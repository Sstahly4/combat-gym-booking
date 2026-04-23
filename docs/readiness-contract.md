# Owner go-live readiness contract

> **In-repo summary** of the canonical go-live contract used by `getGymReadiness(...)`.
> Single source of truth for **what must be true before a gym appears in search**, what is **just guidance**, and **how the dashboard surfaces both**.
> Last reviewed: 2026-04-19.

The fully-signed external artifact lives at:
`/Users/seth/Documents/Business/CombatStay.com/Documents/combatstay_readiness_contract.docx`.

If anything in this file disagrees with that document, the `.docx` wins and this file should be updated in the same commit as the code change.

---

## Decision: go-live state model

We use **`gyms.is_live BOOLEAN NOT NULL DEFAULT false`** as the owner-controlled go-live flag (Option B in the source contract).

- `verification_status` (`unverified | verified | trusted`) stays **independent** and is admin-controlled.
- A gym must be **`is_live = true`** to appear in search.
- An admin can pause/unpause via verification independently of `is_live`.
- No auto-backfill: rows existing before migration `032_owner_portal_backbone.sql` start at `false` and require an explicit go-live action.

Implementation:
- Migration: `supabase/migrations/032_owner_portal_backbone.sql`
- Endpoint: `app/api/onboarding/go-live/route.ts`
- Server check: `lib/onboarding/readiness.ts` (`getGymReadiness(...) → canGoLive`)

---

## Required gates (must pass before `canGoLive`)

These map directly to `required[]` returned by `getGymReadiness(...)`. **All must pass.**

| Gate                              | Source of truth                                                                  | Notes                                  |
|-----------------------------------|----------------------------------------------------------------------------------|----------------------------------------|
| Profile basics complete           | `gyms.name`, `gyms.country`, `gyms.city`, `gyms.description`                     | Wizard step 1                          |
| At least 1 listing image          | `gym_images` rows                                                                | Wizard step 4                          |
| At least 1 active package         | `packages.is_active = true` for `gym_id`                                         | Wizard step 5                          |
| Cancellation policy explicit      | `gyms.cancellation_policy_*` columns (snapshot in `036_*`)                       | Default fallback acceptable, see below |
| Stripe Connect ready              | `gyms.stripe_connect_verified = true` (synced from `account.updated` webhook)    | See M2 §D                              |
| Owner email verified              | Supabase Auth `email_confirmed_at`                                                | Security onboarding                    |

**Cancellation policy default fallback:** if owner does not set explicit values, we use the platform default (codified in `cancellation-policy-snapshot` migration). The default is **acceptable** for go-live but is also surfaced as an `optional` nudge so owners can customize.

---

## Optional / recommended (nudges only — never block go-live)

These map to `optional[]`. Surfaced in `DashboardSetupGuide` and the wizard review page.

- Add gym amenities and disciplines
- Upload at least 3 listing images
- Add team members or coaches
- Set seasonal availability windows
- Connect promotional discounts (`gym_promotions`)
- Customize cancellation policy beyond default
- Enable optional TOTP MFA
- Add payout statement descriptor in Stripe

These are tracked individually as non-blocking checks. Dashboard surfaces them with deep links to the appropriate wizard step or settings tab.

---

## Server-side enforcement

- **One source of truth:** `getGymReadiness({ supabase, gymId, ownerId })` in `lib/onboarding/readiness.ts`.
- Reused by:
  - `GET /api/onboarding/readiness` (dashboard + review pages)
  - `POST /api/onboarding/go-live` (re-validates server-side; refuses with 400 if any required gate fails)
  - `app/manage/onboarding/review/page.tsx` (final pre-flight UI)
  - `app/manage/page.tsx` (dashboard `DashboardSetupGuide`)

If you add a new required gate:
1. Add it to `required[]` in `getGymReadiness(...)`.
2. Add a corresponding wizard step or deep-link target.
3. Update this file under **Required gates** table.
4. Update `GYM_OWNER_PORTAL_IMPLEMENTATION_TRACKER.md` Step 0 if the contract shape changes.

If you add a new optional nudge:
- Just add it to `optional[]`. Do **not** change `canGoLive` semantics.

---

## Telemetry expected for the readiness lifecycle

Owner-portal telemetry events (see `lib/telemetry/owner-events.ts`) tied to readiness:

- `wizard_step_completed` — emitted from `POST /api/onboarding/wizard/step` when `completed = true`
- `wizard_step_abandoned` — heuristic: emitted client-side when wizard unmounts mid-step (future)
- `readiness_checked` — emitted from `GET /api/onboarding/readiness`
- `readiness_failed` — emitted when `canGoLive = false` AND owner explicitly attempted go-live
- `go_live_succeeded` / `go_live_failed` — emitted from `POST /api/onboarding/go-live`

Telemetry is **best-effort** and never blocks the user-facing response.

---

## Change log

| Date       | Change                                                                  |
|------------|-------------------------------------------------------------------------|
| 2026-04-19 | Initial in-repo summary added; aligned with shipped readiness behavior. |
