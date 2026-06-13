export function affiliateReferralUrl(code: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/\/$/, '')}` : 'https://www.combatstay.com')
  return `${base}/ref/${encodeURIComponent(code)}`
}
