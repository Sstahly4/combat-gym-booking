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
