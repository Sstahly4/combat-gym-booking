import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey || stripeSecretKey.includes('your_stripe') || stripeSecretKey.includes('your_str')) {
  console.error('⚠️  STRIPE_SECRET_KEY is not configured properly. Please set a valid Stripe secret key in your .env.local file.')
} else if (stripeSecretKey.startsWith('sk_live_')) {
  console.warn('⚠️  WARNING: You are using LIVE mode Stripe keys!')
  console.warn('   For testing, use TEST mode keys (sk_test_...) from https://dashboard.stripe.com/test/apikeys')
  console.warn('   Test cards (like 4242 4242 4242 4242) only work with TEST mode keys.')
}

export const stripe = stripeSecretKey && !stripeSecretKey.includes('your_stripe') && !stripeSecretKey.includes('your_str')
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })
  : null

export const PLATFORM_COMMISSION_RATE = parseFloat(
  process.env.PLATFORM_COMMISSION_RATE || '0.15'
)
