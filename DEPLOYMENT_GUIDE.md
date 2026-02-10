# 🚀 Production Deployment Guide

Complete step-by-step guide to deploy your Combat Gym Booking platform to production.

## Prerequisites

- ✅ Domain purchased and ready
- ✅ All environment variables configured
- ✅ Stripe account set up (with live keys)
- ✅ Supabase project ready
- ✅ Resend account with domain verified

---

## Step 1: Initialize Git Repository

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - Production ready"
```

---

## Step 2: Create GitHub Repository

1. **Go to GitHub**: https://github.com/new
2. **Repository name**: `combat-gym-booking` (or your preferred name)
3. **Visibility**: Private (recommended) or Public
4. **DO NOT** initialize with README, .gitignore, or license (you already have these)
5. **Click "Create repository"**

---

## Step 3: Connect Local Repository to GitHub

```bash
# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/combat-gym-booking.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

---

## Step 4: Deploy to Vercel

### 4.1 Create Vercel Account

1. **Go to Vercel**: https://vercel.com
2. **Sign up** with your GitHub account (recommended for easy integration)
3. **Import your GitHub repository**:
   - Click "Add New..." → "Project"
   - Select your repository
   - Click "Import"

### 4.2 Configure Project Settings

**Framework Preset**: Next.js (should auto-detect)

**Root Directory**: `./` (default)

**Build Command**: `pnpm build` (or `npm run build` if using npm)

**Output Directory**: `.next` (default)

**Install Command**: `pnpm install` (or `npm install`)

### 4.3 Add Environment Variables

**⚠️ CRITICAL: Add ALL environment variables in Vercel dashboard**

Go to: **Project Settings → Environment Variables**

Add these variables (use **PRODUCTION** values):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# Stripe (LIVE keys - NOT test keys!)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...  # From Stripe Dashboard → Webhooks

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_google_maps_key

# Resend (Email)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com  # Use your verified domain

# App (PRODUCTION URL - your domain)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
PLATFORM_COMMISSION_RATE=0.15
```

**Important Notes:**
- ✅ Use **LIVE** Stripe keys (`pk_live_`, `sk_live_`) - NOT test keys
- ✅ Update `NEXT_PUBLIC_APP_URL` to your actual domain
- ✅ Use production email domain for `RESEND_FROM_EMAIL`
- ✅ Add variables for **Production** environment (not Preview/Development)

### 4.4 Deploy

1. Click **"Deploy"**
2. Wait for build to complete (usually 2-5 minutes)
3. You'll get a Vercel URL like: `your-project.vercel.app`

---

## Step 5: Configure Custom Domain

### 5.1 Add Domain in Vercel

1. Go to **Project Settings → Domains**
2. Click **"Add Domain"**
3. Enter your domain: `yourdomain.com`
4. Also add `www.yourdomain.com` (optional but recommended)

### 5.2 Configure DNS Records

Vercel will show you the DNS records to add. You need to add these in your domain registrar (GoDaddy, Namecheap, etc.):

**For Root Domain (yourdomain.com):**
- **Type**: `A`
- **Name**: `@` (or leave blank)
- **Value**: `76.76.21.21` (Vercel's IP - check Vercel dashboard for current IP)

**For WWW Subdomain (www.yourdomain.com):**
- **Type**: `CNAME`
- **Name**: `www`
- **Value**: `cname.vercel-dns.com` (or what Vercel shows you)

**Alternative (Recommended):**
- Use Vercel's nameservers (easier, but requires changing nameservers at registrar)
- Vercel will provide nameservers like: `ns1.vercel-dns.com`, `ns2.vercel-dns.com`
- Update nameservers at your domain registrar

### 5.3 Wait for DNS Propagation

- DNS changes can take **5 minutes to 48 hours** (usually 15-30 minutes)
- Check status in Vercel dashboard
- Test with: `nslookup yourdomain.com` or https://dnschecker.org

---

## Step 6: Configure Stripe Webhook (Production)

### 6.1 Get Webhook Endpoint URL

After deployment, your webhook URL will be:
```
https://yourdomain.com/api/webhooks/stripe
```

### 6.2 Configure in Stripe Dashboard

1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Click **"Add endpoint"**
3. **Endpoint URL**: `https://yourdomain.com/api/webhooks/stripe`
4. **Events to send**: Select these events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.succeeded`
   - `charge.failed`
5. Click **"Add endpoint"**
6. **Copy the webhook signing secret** (starts with `whsec_`)
7. **Update in Vercel**: Add/update `STRIPE_WEBHOOK_SECRET` environment variable

---

## Step 7: Verify Production Setup

### 7.1 Test Checklist

- [ ] Site loads at your domain
- [ ] HTTPS is working (SSL certificate auto-provisioned by Vercel)
- [ ] Can browse gyms
- [ ] Can create account
- [ ] Can make test booking (use Stripe test mode first, then switch to live)
- [ ] Emails are sending (check Resend dashboard)
- [ ] Maps are loading (Google Maps)
- [ ] Payments work (test with Stripe test card first)

### 7.2 Switch Stripe to Live Mode

**⚠️ Only after thorough testing:**

1. Update Vercel environment variables:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → `pk_live_...`
   - `STRIPE_SECRET_KEY` → `sk_live_...`
2. Update webhook secret to production webhook
3. **Redeploy** (Vercel will auto-redeploy when env vars change, or trigger manually)

---

## Step 8: Post-Deployment Tasks

### 8.1 Update Google Maps API Restrictions

1. Go to **Google Cloud Console → APIs & Services → Credentials**
2. Edit your API key
3. Under **Application restrictions**, add your production domain:
   - `https://yourdomain.com/*`
   - `https://www.yourdomain.com/*`

### 8.2 Verify Resend Domain

1. Go to **Resend Dashboard → Domains**
2. Verify your domain is added and verified
3. Check SPF, DKIM records are set (Resend provides these)

### 8.3 Set Up Monitoring

- **Vercel Analytics**: Enable in Vercel dashboard (free tier available)
- **Error Tracking**: Consider Sentry or similar
- **Uptime Monitoring**: UptimeRobot (free) or similar

### 8.4 Security Checklist

- [ ] All environment variables are set (no missing vars)
- [ ] Using production Stripe keys (not test keys)
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] CORS configured correctly
- [ ] Supabase RLS policies are production-ready
- [ ] No sensitive data in client-side code

---

## Step 9: Continuous Deployment

**Vercel automatically deploys on every push to main branch:**

```bash
# Make changes locally
git add .
git commit -m "Your changes"
git push origin main

# Vercel will automatically:
# 1. Detect the push
# 2. Build your app
# 3. Deploy to production
```

**Preview Deployments**: Every PR gets a preview URL automatically

---

## Troubleshooting

### Build Fails

- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Check for TypeScript errors: `pnpm run build` locally

### Domain Not Working

- Wait for DNS propagation (can take up to 48 hours)
- Verify DNS records are correct
- Check Vercel domain status shows "Valid Configuration"

### Environment Variables Not Working

- **Redeploy** after adding/updating env vars (Vercel doesn't auto-redeploy)
- Check variable names match exactly (case-sensitive)
- Verify you're editing **Production** environment, not Preview

### Stripe Webhook Not Working

- Verify webhook URL is correct: `https://yourdomain.com/api/webhooks/stripe`
- Check webhook secret matches in Vercel env vars
- Test webhook in Stripe dashboard → Send test webhook

---

## Quick Reference

**Vercel Dashboard**: https://vercel.com/dashboard

**Stripe Dashboard**: https://dashboard.stripe.com

**Supabase Dashboard**: https://app.supabase.com

**Resend Dashboard**: https://resend.com/dashboard

**DNS Checker**: https://dnschecker.org

---

## Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Stripe Webhooks**: https://stripe.com/docs/webhooks

---

**🎉 Congratulations! Your app is now live!**
