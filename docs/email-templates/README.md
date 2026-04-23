# Supabase auth email templates

These HTML files are the branded versions of the emails Supabase sends during
auth flows. They live in the repo so they're versioned and easy to restore, but
Supabase does **not** read them from here — you must paste them into the
Supabase dashboard for them to take effect.

## Where to paste

Open your Supabase project → **Authentication → Email Templates** and paste the
corresponding HTML into the "Message body" field of each template:

| Template in Supabase | File in this repo | When it fires |
|---|---|---|
| **Confirm signup** | `confirm-signup.html` | Anyone signs up with email + password (owners, fighters, travelers). Same template; redirect is role-specific in code. |
| **Invite user** | `invite-user.html` | New owner uses the self-serve form at `/manage/list-your-gym` (admin-generated invite). |
| **Reset password** | `reset-password.html` | User clicks "Forgot password?" on `/auth/signin`. |
| **Change email address** | `change-email.html` | Signed-in user changes their email and must confirm the new address. |
| **Magic Link** | `magic-link.html` | Passwordless sign-in via `signInWithOtp`. Not wired up today — template kept ready. |

Also set the **Subject** field for each:

- Confirm signup: `Confirm your CombatStay account`
- Invite user: `Finish setting up your CombatStay listing`
- Reset password: `Reset your CombatStay password`
- Change email address: `Confirm your new CombatStay email`
- Magic Link: `Your CombatStay sign-in link`

## How the CTA link works

Supabase substitutes `{{ .ConfirmationURL }}` at send time. In our codebase we
already set `emailRedirectTo` on `supabase.auth.signUp` and `redirectTo` on
`inviteUserByEmail` / `resetPasswordForEmail`, so the URL Supabase injects
will route the user through `/auth/callback` and on to the right next step:

- Owner signup → `/manage/security-onboarding`
- Fighter / traveler signup → `/` (or `redirect` query param if present)
- Self-serve invite → `/manage/security-onboarding?entry=self-serve`
- Reset password → `/auth/reset-password`

No template edits needed when those destinations change — it's all driven from code.

## Design

All auth templates share one design system — Booking.com-inspired with an
Apple-clean layout:

- System font stack, 16px body, generous line-height
- Brand band at top using `#003580`
- Primary CTA button with the same blue, 44px tap target
- Muted support copy in grey (`#6b7280`)
- Footer with legal line + sender address
- Mobile-safe tables (600px max-width, fluid on narrow viewports)
- Inline styles only (required by email clients)

## Preview / test

After pasting:

1. Trigger the flow (e.g. sign up a test owner at `/auth/signup?intent=owner`).
2. Check the received email renders correctly in Gmail web, Gmail iOS, Apple
   Mail macOS, and Outlook web (the big four that cover ~90% of users).
3. If the CTA button renders as a plain link on Outlook desktop, that's a known
   Outlook VML quirk — it still works, just looks slightly less polished.
