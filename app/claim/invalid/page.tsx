/**
 * Public landing for invalid / expired / used claim links. We never leak
 * which case it is in detail; we just tell the visitor to ask the admin to
 * resend the link.
 */
import Link from 'next/link'

const REASON_COPY: Record<string, { title: string; body: string }> = {
  not_found:  { title: 'This claim link is not valid', body: 'The link you opened is not recognised. Ask the CombatStay team to resend a fresh one.' },
  used:       { title: 'This claim link has already been used', body: 'Your gym account has already been claimed. Sign in below — if it wasn\u2019t you, contact us right away.' },
  revoked:    { title: 'This claim link has been revoked', body: 'The previous link has been cancelled. Ask us to send you a new one.' },
  expired:    { title: 'This claim link has expired', body: 'For your security, claim links only work for a short window. Ask us to send a fresh link.' },
  missing:    { title: 'This claim link is incomplete', body: 'The URL is missing the security token. Open the original link from us again.' },
  gym_missing:{ title: 'This claim link is not valid', body: 'We couldn\u2019t find the gym attached to this link. Contact us so we can sort it out.' },
  owner_missing: { title: 'This claim link is not valid', body: 'The account this link points to is no longer available. Contact us for a new link.' },
  link_failed: { title: 'Something went wrong', body: 'We couldn\u2019t sign you in just now. Try the link again in a moment, or ask us for a new one.' },
  session_failed: { title: 'Something went wrong', body: 'We couldn\u2019t sign you in. Try the link again in a moment, or ask us for a new one.' },
  misconfigured: {
    title: 'Claim links are temporarily unavailable',
    body: 'Our team needs to finish a server configuration step. Please try again later or contact us — your link is still valid once this is fixed.',
  },
}

export default function ClaimInvalidPage({
  searchParams,
}: { searchParams: { reason?: string } }) {
  const reason = searchParams?.reason ?? 'not_found'
  const copy = REASON_COPY[reason] ?? REASON_COPY.not_found

  return (
    <main className="mx-auto flex min-h-[calc(100svh-5rem)] max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-stone-900">{copy.title}</h1>
      <p className="mt-3 text-stone-600">{copy.body}</p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/auth/signin"
          className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
        >
          Sign in
        </Link>
        <Link
          href="mailto:hello@combatstay.com"
          className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-50"
        >
          Contact support
        </Link>
      </div>
    </main>
  )
}
