# Supabase Email Configuration - Use Resend Instead

## The Problem

Supabase Auth uses its own email service by default, which has strict rate limits:
- **Free tier**: Very limited (often just a few emails per hour)
- **Paid tier**: Still has rate limits
- This causes "email rate limit exceeded" errors even during testing

## The Solution

Configure Supabase to use **Resend SMTP** instead of Supabase's default email service.

## Step 1: Get Resend SMTP Credentials

1. Go to [Resend Dashboard](https://resend.com/emails)
2. Navigate to **Settings → SMTP**
3. You'll see SMTP credentials:
   - **SMTP Host**: `smtp.resend.com`
   - **SMTP Port**: `465` (SSL) or `587` (TLS)
   - **SMTP Username**: `resend`
   - **SMTP Password**: Your Resend API key (starts with `re_`)
   - **From Email**: Your verified domain email (e.g., `noreply@yourdomain.com`)

## Step 2: Configure Supabase Custom SMTP

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings → Auth → SMTP Settings**
4. Enable **Custom SMTP**
5. Fill in the Resend SMTP credentials:
   - **Host**: `smtp.resend.com`
   - **Port**: `465` (recommended) or `587`
   - **Username**: `resend`
   - **Password**: Your Resend API key (from `.env` file: `RESEND_API_KEY`)
   - **Sender email**: Your verified Resend email (e.g., `noreply@yourdomain.com`)
   - **Sender name**: `CombatBooking` (or your app name)
6. **Test the connection** - Supabase will send a test email
7. **Save** the settings

## Step 3: Verify It Works

1. Try creating a new account
2. Check that the confirmation email comes from your Resend domain
3. Check Resend dashboard - you should see the email in your sent emails

## Benefits

✅ **No rate limits** - Resend has much higher limits (100,000/month on free tier)
✅ **Better deliverability** - Resend is optimized for transactional emails
✅ **Unified email service** - All emails (auth + booking) go through Resend
✅ **Better tracking** - See all emails in Resend dashboard

## Important Notes

- **Resend API Key**: Use the same key from your `.env` file (`RESEND_API_KEY`)
- **From Email**: Must be a verified domain in Resend
- **Testing**: After configuring, wait 1-2 minutes for changes to propagate
- **Fallback**: If SMTP fails, Supabase will fall back to its default service (but you shouldn't need this)

## Troubleshooting

If emails still don't send:
1. Verify your Resend domain is properly configured (SPF, DKIM records)
2. Check Resend dashboard for any errors
3. Verify SMTP credentials are correct (especially the API key)
4. Check Supabase logs for SMTP connection errors
