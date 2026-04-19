/**
 * Central Stripe **client** for server-side API routes.
 *
 * The Stripe Node SDK constructs a single `Stripe` instance with your secret key.
 * We intentionally **do not** pin `apiVersion` here — the installed SDK already targets
 * the latest pinned version (e.g. `2026-03-25.dahlia`), which keeps types and behavior aligned.
 *
 * @example
 * ```ts
 * import { getStripeClient } from '@/lib/stripe/stripe-client'
 *
 * const stripe = getStripeClient()
 * await stripe.products.create({ name: 'Example' })
 * ```
 *
 * @see https://github.com/stripe/stripe-node
 */
import Stripe from 'stripe'

let cached: Stripe | null = null

/** Human-readable error when env is missing (used by API routes). */
export class StripeConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StripeConfigError'
  }
}

/**
 * Returns a singleton `Stripe` client (`stripeClient` pattern from Stripe docs).
 *
 * @throws {StripeConfigError} If `STRIPE_SECRET_KEY` is unset or still a placeholder.
 */
export function getStripeClient(): Stripe {
  // ---------------------------------------------------------------------------
  // STEP 1: Read the platform secret key from the environment.
  // Replace in `.env.local`:
  //   STRIPE_SECRET_KEY=sk_test_...   (Dashboard → Developers → API keys)
  // ---------------------------------------------------------------------------
  const key = process.env.STRIPE_SECRET_KEY?.trim()

  if (
    !key ||
    key.includes('your_stripe') ||
    key.includes('your_str') ||
    key.startsWith('pk_')
  ) {
    throw new StripeConfigError(
      [
        'STRIPE_SECRET_KEY is missing or invalid.',
        'Set STRIPE_SECRET_KEY in .env.local to your platform **secret** key (sk_test_... or sk_live_...).',
        'Never commit real keys. Use test keys for development.',
        'Dashboard: https://dashboard.stripe.com/test/apikeys',
      ].join(' ')
    )
  }

  if (!cached) {
    // -------------------------------------------------------------------------
    // STEP 2: Instantiate the client once. No apiVersion: SDK default applies.
    // All subsequent calls use this instance: stripe.v2.core.*, stripe.checkout.*, etc.
    // -------------------------------------------------------------------------
    cached = new Stripe(key)
  }

  return cached
}

/**
 * Public site URL for return/refresh/success redirects (hosted Checkout, Connect links).
 *
 * @throws {StripeConfigError} If `NEXT_PUBLIC_APP_URL` is unset.
 */
export function getPublicBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (!raw) {
    throw new StripeConfigError(
      [
        'NEXT_PUBLIC_APP_URL is not set.',
        'Set it to your app root, e.g. http://localhost:3000 for local dev.',
        'Stripe hosted flows redirect back to URLs built from this value.',
      ].join(' ')
    )
  }
  return raw.replace(/\/$/, '')
}

/**
 * Stripe **live mode** (`sk_live_`) requires `return_url` / `refresh_url` / Checkout redirects to use **HTTPS**.
 * Upgrades `http://` to `https://` for public hosts; with live keys, rejects `http://localhost` (use `sk_test_` locally).
 */
export function normalizeStripeRedirectBaseUrl(baseUrl: string): string {
  let s = baseUrl.trim().replace(/\/$/, '')
  if (!s) {
    throw new StripeConfigError('Redirect base URL is empty.')
  }

  const live = process.env.STRIPE_SECRET_KEY?.trim().startsWith('sk_live_') ?? false
  if (!live) {
    return s
  }

  if (!/^https?:\/\//i.test(s)) {
    s = `https://${s}`
  }

  let url: URL
  try {
    url = new URL(s)
  } catch {
    throw new StripeConfigError(`Invalid redirect base URL: ${baseUrl}`)
  }

  if (url.protocol === 'http:') {
    const host = url.hostname
    const isLocal =
      host === 'localhost' || host === '127.0.0.1' || host === '[::1]'
    if (isLocal) {
      throw new StripeConfigError(
        [
          'Live Stripe (sk_live_) requires HTTPS redirect URLs.',
          'Use sk_test_ keys with http://localhost for local dev,',
          'or set NEXT_PUBLIC_APP_URL to your production site (https://...).',
        ].join(' ')
      )
    }
    url.protocol = 'https:'
  }

  return url.origin
}
