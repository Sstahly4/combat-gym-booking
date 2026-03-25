# Payment Flow & Email Notifications

## ✅ Payment Flow (Booking.com MVP Model)

### User Journey
1. **User completes booking form** → Creates booking with status `pending_payment`
2. **User enters card details** → Payment Intent created with `capture_method: 'manual'`
3. **User clicks "Confirm Booking"** → Card is **authorized** (NOT charged)
4. **Success page** → Calls `/api/bookings/[id]/confirm-payment`
5. **Status updated** → `pending_confirmation`
6. **Emails sent** → Admin notification + User confirmation

### Admin Actions
1. **Receive email** with full booking details
2. **Contact gym** to confirm availability
3. **If confirmed** → Call `/api/bookings/[id]/capture` to charge the card
4. **Status updated** → `confirmed`
5. **Manual payout** → Transfer 85% to gym (offline)

### Important Notes
- ✅ **Card is NOT charged** when user submits (only authorized)
- ✅ **No money leaves user's account** until you capture payment
- ✅ **Payment goes to YOUR platform account** (not gym's Stripe account)
- ✅ **Manual settlement** with gym (bank transfer, etc.)

## 📧 Email Notifications

### Setup Options

#### Option 1: Resend (Recommended - Free tier available)
1. Sign up at https://resend.com
2. Get your API key
3. Add to `.env.local`:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   RESEND_FROM_EMAIL=bookings@yourdomain.com
   ADMIN_EMAIL=your-email@example.com
   ```
4. Install Resend (optional - will be auto-imported):
   ```bash
   pnpm add resend
   ```

#### Option 2: Console Logging (Development)
- If `RESEND_API_KEY` is not set, emails will be logged to console
- Check your terminal/server logs for booking notifications
- Format: Detailed booking information with all details

### What You'll Receive

#### Admin Email Includes:
- ✅ Booking reference & PIN
- ✅ Gym name, location, owner contact
- ✅ Package & accommodation details
- ✅ Check-in/out dates & duration
- ✅ Guest name, email, phone
- ✅ Training details (discipline, experience, notes)
- ✅ **Payment info**: Payment Intent ID, card last 4 digits, brand
- ✅ **Price breakdown**: Total, platform fee, gym payout
- ✅ **Action items**: Steps to confirm with gym

#### User Confirmation Email Includes:
- ✅ Booking reference
- ✅ Gym name
- ✅ Dates
- ✅ Package/accommodation
- ✅ Clear message: "Card authorized, not charged yet"

## 🧪 Testing the Flow

### ⚠️ IMPORTANT: Use TEST Mode Keys
**You MUST use Stripe TEST mode keys for testing:**
- Secret key should start with `sk_test_` (NOT `sk_live_`)
- Publishable key should start with `pk_test_` (NOT `pk_live_`)
- Get them from: https://dashboard.stripe.com/test/apikeys

**If you use live keys with test cards, you'll get:**
> "Your card was declined. Your request was in live mode, but used a known test card."

### Test Card (Stripe Test Mode)
Use Stripe's test card: `4242 4242 4242 4242`
- Any future expiry date
- Any 3-digit CVC
- Any ZIP code

### What to Expect
1. **In Stripe Dashboard**:
   - Payment Intent shows as `requires_capture`
   - Status: `succeeded` (authorized, not captured)
   - No completed charge in your bank

2. **In Your Email/Console**:
   - Admin notification with all booking details
   - User confirmation email

3. **In Database**:
   - Booking status: `pending_confirmation`
   - `stripe_payment_intent_id` populated

### To Capture Payment (After Gym Confirms)
```bash
# Via API (requires admin/owner role)
POST /api/bookings/{bookingId}/capture
```

Or manually in Stripe Dashboard:
1. Go to Payment Intents
2. Find the payment intent
3. Click "Capture payment"

## 🔍 Verifying Payment Authorization

### Check Stripe Dashboard
1. Go to https://dashboard.stripe.com/test/payments
2. Find the Payment Intent (search by booking reference in metadata)
3. Status should be: **"Requires capture"** or **"Succeeded"** (authorized)
4. **NOT** "Captured" (that means money was charged)

### Check Your Bank
- ✅ **Should NOT show** a completed charge
- ✅ **May show** a pending authorization (this is normal)
- ✅ Authorization will expire if not captured (usually 7 days)

## 🚨 Troubleshooting

### "No email received"
- Check console logs (if Resend not configured)
- Verify `ADMIN_EMAIL` in `.env.local`
- Check Resend dashboard for delivery status

### "Payment was charged immediately"
- ❌ This means `capture_method` is set to `automatic`
- ✅ Should be `manual` (check `app/api/bookings/[id]/payment-intent/route.ts`)

### "Can't find payment intent"
- Check booking has `stripe_payment_intent_id`
- Verify Stripe API key is correct
- Check Stripe dashboard for the payment intent

### "Your card was declined. Your request was in live mode, but used a known test card"
- ❌ **You're using LIVE mode Stripe keys with a test card**
- ✅ **Solution**: Use TEST mode keys in your `.env.local`:
  - `STRIPE_SECRET_KEY` should start with `sk_test_` (NOT `sk_live_`)
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` should start with `pk_test_` (NOT `pk_live_`)
- Get test keys from: https://dashboard.stripe.com/test/apikeys
- **Restart your dev server** after changing keys

## 📝 Environment Variables

Required for full functionality:
```env
# Stripe (MUST be TEST mode keys for development/testing)
STRIPE_SECRET_KEY=sk_test_...  # ⚠️ Must start with sk_test_ (NOT sk_live_)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # ⚠️ Must start with pk_test_ (NOT pk_live_)

# Email (Optional - uses console if not set)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=bookings@yourdomain.com
ADMIN_EMAIL=your-email@example.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🎯 Success Criteria

After a test booking, you should have:
- ✅ Booking in database with status `pending_confirmation`
- ✅ Payment Intent in Stripe (authorized, not captured)
- ✅ Admin email/notification with all details
- ✅ User confirmation email
- ✅ **NO money charged** to the card yet

Once you confirm with gym:
- ✅ Capture payment via API or Stripe dashboard
- ✅ Update booking status to `confirmed`
- ✅ Manually pay gym (85% of total)
