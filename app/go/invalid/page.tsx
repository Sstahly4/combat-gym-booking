/**
 * Public landing for invalid / expired owner login links (/go/…).
 */
const REASONS: Record<string, { title: string; body: string }> = {
  not_found: {
    title: 'This sign-in link is not valid',
    body: 'The link you opened is not recognised. Ask CombatStay for a fresh link, or sign in to Partner Hub with your email and password.',
  },
  revoked: {
    title: 'This sign-in link has been revoked',
    body: 'This link is no longer active. Ask for a new link, or sign in at Partner Hub.',
  },
  expired: {
    title: 'This sign-in link has expired',
    body: 'For your security, sign-in links only work for a limited time. Ask for a fresh link, or sign in with your password.',
  },
  missing: {
    title: 'This sign-in link is incomplete',
    body: 'The URL is missing its code. Open the original link again.',
  },
  owner_missing: {
    title: 'This sign-in link is not valid',
    body: 'We could not find the account for this link. Contact CombatStay support if you need help.',
  },
  not_owner: {
    title: 'This sign-in link is not valid',
    body: 'This link is only for gym partner accounts.',
  },
  use_claim_link: {
    title: 'Finish claiming your gym first',
    body: 'Your listing is still on a claim link. Open the claim link we sent you to set your password first.',
  },
  link_failed: {
    title: 'Could not start your session',
    body: 'Something went wrong creating a secure session. Try again, or sign in at Partner Hub with your password.',
  },
  session_failed: {
    title: 'Could not sign you in',
    body: 'The secure session could not be established. Try the link again, or sign in with your password.',
  },
  misconfigured: {
    title: 'Sign-in links are temporarily unavailable',
    body: 'Partner email sign-in is being configured. Sign in at Partner Hub with your email and password for now.',
  },
}

export default function OwnerLoginInvalidPage({
  searchParams,
}: {
  searchParams: { reason?: string }
}) {
  const reason = (searchParams.reason || 'not_found').trim()
  const copy = REASONS[reason] || REASONS.not_found

  return (
    <main className="min-h-[70vh] bg-gradient-to-b from-stone-50 to-white px-4 py-16">
      <div className="mx-auto max-w-lg text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">CombatStay</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-stone-900">{copy.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">{copy.body}</p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href="/auth/signin?redirect=/manage/bookings"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-[#003580] px-5 text-sm font-medium text-white hover:bg-[#002a66]"
          >
            Sign in to Partner Hub
          </a>
          <a
            href="/auth/signin"
            className="inline-flex h-11 items-center justify-center rounded-lg px-5 text-sm font-medium text-[#003580] underline-offset-4 hover:underline"
          >
            Use email &amp; password instead
          </a>
        </div>
      </div>
    </main>
  )
}
