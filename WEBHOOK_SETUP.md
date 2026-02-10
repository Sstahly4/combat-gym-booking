# Stripe Webhook Setup Guide

## For Local Development

Stripe webhooks require a publicly accessible URL. For local development, use one of these methods:

### Option 1: Stripe CLI (Recommended) ⭐

The easiest way to test webhooks locally:

1. **Install Stripe CLI**:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe**:
   ```bash
   stripe login
   ```

3. **Forward webhooks to your local server**:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. **Copy the webhook signing secret** (starts with `whsec_`):
   - The CLI will output something like: `Ready! Your webhook signing secret is whsec_...`
   - ⚠️ **IMPORTANT**: You MUST use the secret from the CLI output, NOT from the Stripe Dashboard
   - Add this to your `.env.local`:
     ```
     STRIPE_WEBHOOK_SECRET=whsec_...
     ```
   - **Restart your Next.js server** after adding the secret

5. **Trigger test events**:
   ```bash
   # Test payment_intent.succeeded event
   stripe trigger payment_intent.succeeded
   ```

Now when you capture a payment in Stripe (or trigger a test event), it will be forwarded to your local server!

### Option 2: ngrok (Alternative)

1. **Install ngrok**:
   ```bash
   brew install ngrok
   # Or download from: https://ngrok.com/
   ```

2. **Start your Next.js server**:
   ```bash
   npm run dev
   ```

3. **Expose localhost**:
   ```bash
   ngrok http 3000
   ```

4. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

5. **Add webhook in Stripe Dashboard**:
   - Go to: https://dashboard.stripe.com/test/webhooks
   - Click "Add endpoint"
   - Endpoint URL: `https://abc123.ngrok.io/api/webhooks/stripe`
   - Select event: `payment_intent.succeeded`
   - Copy the webhook signing secret and add to `.env.local`

⚠️ **Note**: The ngrok URL changes each time you restart ngrok (unless you have a paid plan).

### Option 3: Manual Sync (For Testing)

For now, you can manually sync bookings after capturing in Stripe:

1. Go to Admin Dashboard → Bookings
2. Click on the booking
3. Click "Sync with Stripe (if already captured)"
4. This will update the booking status and send the email

## For Production

1. **Add webhook in Stripe Dashboard**:
   - Go to: https://dashboard.stripe.com/webhooks (or test: https://dashboard.stripe.com/test/webhooks)
   - Click "Add endpoint"
   - Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
   - Select event: `payment_intent.succeeded`
   - Copy the webhook signing secret

2. **Add to production environment variables**:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## Testing

After setup, test by:

1. **Creating a test booking** (use test card: `4242 4242 4242 4242`)
2. **Capturing the payment** in Stripe Dashboard
3. **Check your server logs** - you should see:
   ```
   ✅ Webhook received: payment_intent.succeeded
   📦 Processing payment_intent.succeeded for: pi_...
   ✅ Found booking: ...
   ✅ Booking status updated to confirmed
   📧 Sending confirmation email to: ...
   ✅ Confirmation email sent successfully
   ```

4. **Verify in database** - booking status should be `confirmed`
5. **Check email** - guest should receive confirmation email

## Troubleshooting

### "Webhook signature verification failed" / "No signatures found matching the expected signature"

This is the most common issue. Here's how to fix it:

1. **If using Stripe CLI**:
   - ✅ Use the webhook secret from the CLI output (when you run `stripe listen`)
   - ❌ Do NOT use the secret from Stripe Dashboard
   - The CLI secret starts with `whsec_` and is shown when you start `stripe listen`
   - Make sure you've added it to `.env.local` as `STRIPE_WEBHOOK_SECRET`
   - **Restart your Next.js server** after adding/updating the secret

2. **If using ngrok or production**:
   - ✅ Use the webhook signing secret from Stripe Dashboard → Webhooks → Your endpoint → Signing secret
   - Make sure the endpoint URL in Stripe matches your actual URL

3. **Check your `.env.local`**:
   ```bash
   # Should look like this (for Stripe CLI):
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   
   # NOT like this (from dashboard):
   STRIPE_WEBHOOK_SECRET=whsec_live_xxxxxxxxxxxxx
   ```

4. **Verify the secret is loaded**:
   - Check your server logs - it should show "Webhook secret configured: true"
   - If it shows "not configured", the environment variable isn't being read

### "Booking not found for payment intent"
- Check that `stripe_payment_intent_id` is set in the booking record
- Verify the payment intent ID matches

### Webhook not received
- Check Stripe CLI is running (if using Option 1)
- Check ngrok is running (if using Option 2)
- Check webhook endpoint URL is correct
- Check server logs for errors
