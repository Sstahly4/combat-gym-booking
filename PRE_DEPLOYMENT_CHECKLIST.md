# ✅ Pre-Deployment Checklist

Use this checklist before deploying to production.

## Environment Variables

- [ ] **Supabase**: Production URLs and keys configured
- [ ] **Stripe**: LIVE keys (`pk_live_`, `sk_live_`) - NOT test keys
- [ ] **Stripe Webhook**: Production webhook secret configured
- [ ] **Google Maps**: API key has production domain restrictions
- [ ] **Resend**: Domain verified, production API key
- [ ] **App URL**: `NEXT_PUBLIC_APP_URL` set to your production domain
- [ ] **Platform Commission**: Rate configured (default: 0.15)

## Stripe Configuration

- [ ] Stripe account is in **LIVE mode (not test mode)**
- [ ] Webhook endpoint configured: `https://yourdomain.com/api/webhooks/stripe`
- [ ] Webhook events selected:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `payment_intent.canceled`
  - `charge.succeeded`
  - `charge.failed`
- [ ] Test with Stripe test mode first, then switch to live

## Domain & DNS

- [ ] Domain purchased and unlocked
- [ ] DNS records ready to configure (Vercel will provide)
- [ ] Plan for DNS propagation time (15-30 minutes typically)

## Email (Resend)

- [ ] Domain added to Resend
- [ ] SPF record added
- [ ] DKIM record added
- [ ] Domain verified in Resend dashboard
- [ ] `RESEND_FROM_EMAIL` uses verified domain

## Code & Build

- [ ] All TypeScript errors resolved
- [ ] Build succeeds locally: `pnpm run build`
- [ ] No console errors in browser
- [ ] All features tested locally
- [ ] Mobile responsive design verified

## Security

- [ ] No sensitive data in client-side code
- [ ] Environment variables properly scoped (NEXT_PUBLIC_ vs server-only)
- [ ] Supabase RLS policies reviewed
- [ ] API routes have proper authentication checks
- [ ] CORS configured correctly

## Testing

- [ ] Can create account
- [ ] Can browse gyms
- [ ] Can make booking
- [ ] Payment flow works (test mode)
- [ ] Emails are sending
- [ ] Maps are loading
- [ ] Images are loading from Supabase storage

## Documentation

- [ ] README.md is up to date
- [ ] Environment variables documented
- [ ] Deployment guide reviewed

---

**Ready to deploy?** Follow `DEPLOYMENT_GUIDE.md`
