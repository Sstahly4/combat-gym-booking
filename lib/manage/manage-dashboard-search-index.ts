/**
 * Curated owner-dashboard search targets (pages + deep links).
 * Live data (gyms, bookings) is merged in the header search component.
 */

export type ManageDashboardSearchHit = {
  id: string
  title: string
  /** Fine print under the title (route / context). */
  subtitle: string
  href: string
  /** Extra tokens for matching (not shown). */
  keywords?: string[]
  /** Shown when the query is empty and the field is focused. */
  quick?: boolean
}

export const MANAGE_DASHBOARD_QUICK_HITS: ManageDashboardSearchHit[] = [
  {
    id: 'quick-home',
    title: 'Dashboard home',
    subtitle: 'Overview · /manage',
    href: '/manage',
    quick: true,
    keywords: ['overview', 'metrics', 'home'],
  },
  {
    id: 'quick-bookings',
    title: 'Bookings',
    subtitle: 'Reservations & payments · /manage/bookings',
    href: '/manage/bookings',
    quick: true,
    keywords: ['reservations', 'guests', 'payments'],
  },
  {
    id: 'quick-calendar',
    title: 'Calendar & availability',
    subtitle: 'Spots & pricing by day · /manage/calendar',
    href: '/manage/calendar',
    quick: true,
    keywords: ['availability', 'dates', 'capacity', 'inventory'],
  },
  {
    id: 'quick-settings-personal',
    title: 'Personal details',
    subtitle: 'Settings · name, phone, language',
    href: '/manage/settings?tab=personal#settings-tab-personal',
    quick: true,
    keywords: ['profile', 'name', 'rename', 'change name', 'language', 'phone', 'account'],
  },
  {
    id: 'quick-settings-security',
    title: 'Security & login',
    subtitle: 'Settings · password, 2FA, sessions',
    href: '/manage/settings?tab=security#settings-tab-security',
    quick: true,
    keywords: ['password', 'mfa', 'totp', 'two factor', 'sessions', 'sign out devices'],
  },
  {
    id: 'quick-payouts',
    title: 'Payouts',
    subtitle: 'Settings · Wise or Stripe, bank details, Connect activity',
    href: '/manage/settings?tab=payouts#settings-tab-payouts',
    quick: true,
    keywords: ['payouts', 'payout settings', 'bank', 'transfers', 'earnings', 'payments', 'balances', 'wise', 'connected account'],
  },
]

export const MANAGE_DASHBOARD_SEARCH_STATIC: ManageDashboardSearchHit[] = [
  ...MANAGE_DASHBOARD_QUICK_HITS,
  {
    id: 'settings-communications',
    title: 'Communications preferences',
    subtitle: 'Settings · email alerts & SMS (coming soon)',
    href: '/manage/settings?tab=communications#settings-tab-communications',
    keywords: ['notifications', 'email', 'sms', 'alerts', 'marketing', 'cancellations'],
  },
  {
    id: 'settings-facility',
    title: 'Facility profile',
    subtitle: 'Settings · gym display name, timezone, public phone',
    href: '/manage/settings?tab=facility#settings-tab-facility',
    keywords: ['timezone', 'reception', 'contact', 'property', 'camp name'],
  },
  {
    id: 'settings-hub',
    title: 'All settings',
    subtitle: 'Personal, security, facility, payouts · /manage/settings',
    href: '/manage/settings',
    keywords: ['preferences', 'account'],
  },
  {
    id: 'reviews',
    title: 'Reviews',
    subtitle: 'Guest feedback · /manage/reviews',
    href: '/manage/reviews',
    keywords: ['ratings', 'reply', 'testimonials'],
  },
  {
    id: 'promotions',
    title: 'Promotions',
    subtitle: 'Deals & visibility · /manage/promotions',
    href: '/manage/promotions',
    keywords: ['discount', 'campaign', 'early bird', 'last minute', 'offers'],
  },
  {
    id: 'verification',
    title: 'Verification',
    subtitle: 'Listing readiness · /manage/verification',
    href: '/manage/verification',
    keywords: ['kyc', 'trust', 'approved', 'live'],
  },
  {
    id: 'help',
    title: 'Help center',
    subtitle: 'Owner FAQs · /manage/help',
    href: '/manage/help',
    keywords: ['support', 'how to', 'faq'],
  },
  {
    id: 'onboarding',
    title: 'Onboarding wizard',
    subtitle: 'Finish listing setup · /manage/onboarding',
    href: '/manage/onboarding',
    keywords: ['setup', 'wizard', 'complete', 'go live'],
  },
  {
    id: 'list-gym',
    title: 'List a new gym',
    subtitle: 'Start another property · /manage/list-your-gym',
    href: '/manage/list-your-gym',
    keywords: ['add gym', 'second location', 'property'],
  },
  {
    id: 'bookings-inquiries',
    title: 'Needs your response',
    subtitle: 'Pending booking requests · Bookings',
    href: '/manage/bookings#book-needs-your-response',
    keywords: ['inquiries', 'messages', 'pending', 'accept', 'decline', 'requests'],
  },
  {
    id: 'bookings-current',
    title: 'Current stays',
    subtitle: 'Guests in camp today · Bookings',
    href: '/manage/bookings#book-current',
    keywords: ['today', 'in house', 'active'],
  },
  {
    id: 'bookings-upcoming',
    title: 'Upcoming arrivals',
    subtitle: 'Future bookings · Bookings',
    href: '/manage/bookings#book-upcoming',
    keywords: ['arrivals', 'schedule'],
  },
  {
    id: 'bookings-older',
    title: 'Past & declined',
    subtitle: 'History · Bookings',
    href: '/manage/bookings#book-older',
    keywords: ['history', 'cancelled', 'archive'],
  },
  {
    id: 'gym-edit',
    title: 'Edit gym listing',
    subtitle: 'Packages, photos, amenities · /manage/gym/edit',
    href: '/manage/gym/edit',
    keywords: ['listing', 'photos', 'packages', 'pricing', 'description', 'amenities'],
  },
  {
    id: 'gym-preview',
    title: 'View listing preview',
    subtitle: 'Public page draft · /manage/gym/preview',
    href: '/manage/gym/preview',
    keywords: ['preview', 'public', 'see listing'],
  },
  {
    id: 'security-onboarding',
    title: 'Security onboarding',
    subtitle: 'Harden your owner account · /manage/security-onboarding',
    href: '/manage/security-onboarding',
    keywords: ['mfa', 'recovery', 'secure account'],
  },
]

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s.-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function blobFor(hit: ManageDashboardSearchHit): string {
  return normalize([hit.title, hit.subtitle, ...(hit.keywords ?? [])].join(' '))
}

function tokenize(q: string): string[] {
  return normalize(q)
    .split(' ')
    .map((t) => t.trim())
    .filter(Boolean)
}

export function scoreManageDashboardHit(hit: ManageDashboardSearchHit, tokens: string[]): number {
  if (tokens.length === 0) return hit.quick ? 1 : 0
  const blob = blobFor(hit)
  let score = 0
  for (const t of tokens) {
    if (!blob.includes(t)) return 0
    const inTitle = normalize(hit.title).includes(t)
    score += inTitle ? 6 : 3
    if (hit.keywords?.some((k) => normalize(k).includes(t))) score += 2
  }
  return score
}

export function filterManageDashboardHits(
  query: string,
  extras: ManageDashboardSearchHit[],
  limit = 12
): ManageDashboardSearchHit[] {
  const tokens = tokenize(query)
  const pool = [...MANAGE_DASHBOARD_SEARCH_STATIC, ...extras]
  const seen = new Set<string>()
  const deduped: ManageDashboardSearchHit[] = []
  for (const h of pool) {
    if (seen.has(h.id)) continue
    seen.add(h.id)
    deduped.push(h)
  }

  if (tokens.length === 0) {
    return deduped.filter((h) => h.quick).slice(0, limit)
  }

  return deduped
    .map((h) => ({ h, s: scoreManageDashboardHit(h, tokens) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.h.title.localeCompare(b.h.title))
    .slice(0, limit)
    .map((x) => x.h)
}

/** Resolve active gym id from session (same key as ActiveGymProvider). */
export function readManageActiveGymIdFromSession(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return sessionStorage.getItem('manage_active_gym_id')
  } catch {
    return null
  }
}

export function withGymQuery(href: string, gymId: string | null): string {
  if (!gymId) return href
  if (href.includes('gym_id=') || href.includes('?id=')) return href
  const isSettings = href.startsWith('/manage/settings')
  const sep = href.includes('?') ? '&' : '?'
  if (isSettings) return `${href}${sep}gym_id=${encodeURIComponent(gymId)}`
  if (href.startsWith('/manage/gym/edit')) return `${href}${href.includes('?') ? '&' : '?'}id=${encodeURIComponent(gymId)}`
  if (href.startsWith('/manage/gym/preview')) return `${href}${sep}gym_id=${encodeURIComponent(gymId)}`
  if (href.startsWith('/manage/calendar')) return `${href}${sep}gym_id=${encodeURIComponent(gymId)}`
  if (href.startsWith('/manage/promotions')) return `${href}${sep}gym_id=${encodeURIComponent(gymId)}`
  return href
}
