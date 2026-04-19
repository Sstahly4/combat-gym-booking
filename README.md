# Combat Gym Booking MVP

A Next.js web application for booking combat sports training camps, inspired by Booking.com and NowMuayThai.com.

## Features

- **Public Gym Directory**: Browse and filter combat sports gyms by location, discipline, price, and amenities
- **Booking System**: Request bookings with Stripe payment integration
- **User Roles**:
  - **Fighter/Trainee**: Browse gyms, request bookings, manage bookings, leave reviews
  - **Gym Owner**: Create gym profiles, manage bookings, receive payments via Stripe Connect
  - **Admin**: Approve gyms, oversee bookings

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database & Auth**: Supabase (PostgreSQL, Auth, Storage)
- **Payments**: Stripe (Connect + Elements)
- **Language**: TypeScript

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file with:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Stripe
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

   # App
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   PLATFORM_COMMISSION_RATE=0.15

   # Gym claim links (admin → pre-listed gym handoff; migration 044). Required in production.
   # Generate once: openssl rand -hex 32 — do not rotate after issuing links.
   CLAIM_TOKEN_PEPPER=
   ```

3. **Set up Supabase**:
   - Create a new Supabase project
   - Run the migration file: `supabase/migrations/001_initial_schema.sql`
   - Create a storage bucket named `gym-images` with public access

4. **Set up Stripe**:
   - Create a Stripe account
   - Enable Stripe Connect
   - Add your Stripe keys to the environment variables

5. **Run the development server**:
   ```bash
   npm run dev
   ```

## Production checklist (hosting env)

Apply all Supabase migrations (including `043_owner_portal_hardening.sql`, `044_gym_claim_tokens.sql`) to the live project — **committing SQL to git does not apply it**; use `supabase db push`, the CLI, or the SQL editor.

Set at minimum:

| Variable | Notes |
|----------|--------|
| `NEXT_PUBLIC_APP_URL` | Canonical site origin (e.g. `https://combatbooking.com`). Used when building gym claim URLs and other absolute links so they are not tied to a random request host. |
| `CLAIM_TOKEN_PEPPER` | **Required in production** for gym claim links: random string **≥ 32 characters** (e.g. output of `openssl rand -hex 32`). Mixed into SHA-256 of claim tokens. **Do not change after links are issued** — rotation invalidates outstanding URLs. If unset in production, generating or redeeming claim links returns HTTP 503 / a safe error page. |
| `SUPABASE_SERVICE_ROLE_KEY` | Already required for admin APIs and webhooks; keep server-only. |

Local/dev may omit `CLAIM_TOKEN_PEPPER` (tokens still work; hashes use an empty pepper — fine for local testing only).

## Database Schema

- `profiles`: User profiles with roles (fighter, owner, admin)
- `gyms`: Gym listings with status (pending, approved, rejected)
- `gym_images`: Images for gyms
- `bookings`: Booking requests with status tracking
- `reviews`: Reviews linked to completed bookings

## Payment Flow

1. User requests booking and enters payment details
2. PaymentIntent created with `capture_method: 'manual'` (funds held)
3. Gym owner receives notification
4. Owner accepts → Payment captured → Funds transferred to gym (minus platform fee)
5. Owner declines → PaymentIntent cancelled → Funds released

## Project Structure

```
app/
  ├── auth/              # Authentication pages
  ├── search/            # Public gym search
  ├── gyms/[id]/         # Gym details page
  ├── bookings/[id]/     # Booking payment & review
  ├── dashboard/         # Fighter dashboard
  ├── manage/            # Gym owner dashboard
  └── admin/             # Admin dashboard

api/
  ├── bookings/          # Booking API routes
  └── stripe/            # Stripe Connect routes

components/
  ├── ui/                # shadcn/ui components
  └── booking-modal.tsx   # Booking request modal
```

## License

MIT
