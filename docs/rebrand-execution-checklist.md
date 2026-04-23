# CombatStay rebrand execution checklist

Goal: replace **every** user-visible instance of the old brand and domains with **CombatStay** / `combatstay.com`, across **Next.js + Supabase + Vercel + Resend**.

This doc is meant to be ticked off in order so we don’t miss hidden metadata, SEO surfaces, or third-party dashboards.

---

## Phase 0 — Pre-flight (dashboards + config)

### Domains / DNS (already done)
- [x] DNS configured for `combatstay.com` (+ `www` if used)

### Supabase Auth (must be correct before deploying)
- [ ] Supabase → Authentication → URL Configuration
  - [ ] **Site URL** set to `https://www.combatstay.com` (or your canonical host)
  - [ ] **Redirect URLs** include:
    - [ ] `https://www.combatstay.com/auth/callback`
    - [ ] `https://www.combatstay.com/auth/reset-password`
    - [ ] any staging URLs you use
- [ ] Supabase → Authentication → Email Templates
  - [x] Confirm signup (generic) pasted from `docs/email-templates/confirm-signup.html`
  - [x] Invite user pasted from `docs/email-templates/invite-user.html`
  - [x] Reset password pasted from `docs/email-templates/reset-password.html`
  - [x] Change email address pasted from `docs/email-templates/change-email.html`
  - [ ] Magic Link pasted from `docs/email-templates/magic-link.html` (only needed if/when enabling passwordless sign-in)
  - [ ] Subjects updated per `docs/email-templates/README.md`

### OAuth providers (lockout risk)
- [ ] Google / Apple / Facebook / etc.
  - [ ] Authorized domains include `combatstay.com`
  - [ ] Authorized redirect URIs updated to new domain
  - [ ] Consent screen app name/logo updated to CombatStay
  - [ ] Post-deploy: validate at least one full login per provider in prod

### Stripe (trust gap)
- [ ] Stripe dashboard branding
  - [ ] Public business name → CombatStay
  - [ ] Support website → `combatstay.com`
  - [ ] Logo / brand colors updated (if using Stripe Checkout / customer emails)
- [ ] Confirm Stripe-generated receipts / emails show CombatStay branding

### Email sender (Resend)
- [ ] Resend domain verified for `combatstay.com`
- [ ] `RESEND_FROM_EMAIL` uses CombatStay domain (e.g. `hello@combatstay.com`)
- [ ] Confirm reply-to/support emails are correct

### Analytics / tracking / webmaster tools
- [ ] GA4 data stream URL updated (if required)
- [ ] GTM/Meta pixel allowed domains updated (if required)
- [ ] Google Search Console
  - [ ] Verify `combatstay.com`
  - [ ] Use “Change of Address” tool (if moving from old domain)

---

## Phase 1 — Core UI + metadata (code)

### Brand constants (recommended to prevent drift)
- [x] Add/update a single source of truth (e.g. `lib/brand.ts`) with:
  - [x] `brandName = "CombatStay"`
  - [x] `brandDomain = "combatstay.com"`
  - [x] canonical site URL helper

### App shell / global metadata
- [x] `app/layout.tsx`
  - [x] `metadata.title` / template
  - [x] `metadata.description`
  - [x] OpenGraph `siteName`
  - [x] Twitter metadata
  - [x] `applicationName`
- [x] `components/footer.tsx` + any header/nav components
- [x] `public/site.webmanifest` (`name`, `short_name`, `start_url`, related links)
- [x] `app/robots.ts` (host references + sitemap link)
- [x] `app/sitemap.ts` (absolute URL generation uses new domain)

### UX copy hot spots
- [ ] Auth pages: `app/auth/signin/page.tsx`, `app/auth/signup/page.tsx` (sign-in modal updated)
- [x] Owner funnel pages: `app/owners/page.tsx`, `app/how-it-works/page.tsx`, `app/destinations/page.tsx`
- [ ] Support & trust pages: `app/contact/page.tsx`, `app/faq/page.tsx` (about/press/careers already updated)

---

## Phase 2 — SEO system + structured data (code)

- [x] `lib/seo/site-url.ts` returns canonical CombatStay URL everywhere
- [x] `lib/seo/guide-schema.ts` (JSON-LD) uses CombatStay name/domain
- [x] Any OG images / metadataBase / canonical tags updated to CombatStay domain (core SEO system uses canonical site URL)
- [x] Verify sitemap URLs are on `combatstay.com` (sitemap uses canonical site URL)

---

## Phase 3 — Blog content sweep (content)

Targets: all `app/blog/**/page.tsx` and any blog index pages.

- [x] Replace brand mentions (old brand → CombatStay)
- [x] Replace old domain references in links
- [x] Verify metadata titles/descriptions/OG for each post (rebrand sweep applied consistently)
- [x] Check image `alt`/`title` attributes for brand mentions (no remaining old-brand strings in blog)

---

## Phase 4 — Legal / policies / FAQs (content)

- [x] `app/terms/page.tsx`
- [x] `app/privacy/page.tsx`
- [x] `app/accessibility/page.tsx`
- [x] `app/faq/page.tsx`
- [x] Any other policy-like docs (`docs/readiness-contract.md`)
- [x] Ensure company/product name is CombatStay everywhere + domain references updated

---

## Phase 5 — Final “no leftovers” sanity pass

### Search passes (do in order)
- [x] Pass 1 (UI): old brand name → (should be **0** results)
- [x] Pass 2 (urls): old domain/handle → (should be **0** results)
- [x] Pass 3 (regex): `*.old-domain.com` style hardcoded subdomains → (should be **0** results)

### Runtime smoke tests (prod or preview)
- [ ] Signup (owner) → confirm email → lands in `/manage/security-onboarding`
- [ ] Signup (fighter/traveler) → confirm email → lands on `/` (or intended redirect)
- [ ] Forgot password email → reset → sign-in works
- [ ] Change email flow email → confirm → new email works
- [ ] Booking email senders (request received / confirmed / declined / accepted) render correctly
- [ ] Robots + sitemap accessible and correct

