/**
 * Post-save / cancel navigation from `/manage/gym/edit` (shared by Partner Hub
 * and Admin Hub). Restricts to same-origin app paths under `/admin` or `/manage`
 * to avoid open redirects via `returnTo`.
 */
export function resolvePostGymEditReturnPath(raw: string | null | undefined): string {
  if (raw == null || typeof raw !== 'string') return '/manage'
  const trimmed = raw.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return '/manage'
  if (trimmed.includes('://')) return '/manage'
  if (trimmed.includes('..')) return '/manage'

  const qIdx = trimmed.indexOf('?')
  const path = qIdx === -1 ? trimmed : trimmed.slice(0, qIdx)
  const search = qIdx === -1 ? '' : trimmed.slice(qIdx)

  if (path === '/admin' || path.startsWith('/admin/')) return path + search
  if (path === '/manage' || path.startsWith('/manage/')) return path + search
  return '/manage'
}

export function manageGymEditHref(
  gymId: string,
  options?: { section?: string | null; returnTo?: string | null },
): string {
  const q = new URLSearchParams()
  q.set('id', gymId)
  if (options?.section) q.set('section', options.section)
  if (options?.returnTo) q.set('returnTo', options.returnTo)
  return `/manage/gym/edit?${q.toString()}`
}

/** First breadcrumb / back target when leaving the gym editor. */
export function manageGymEditHubBreadcrumb(afterPath: string): { label: string; href: string } {
  const path = afterPath.split('?')[0]
  const href = afterPath

  if (path === '/admin/gyms') return { label: 'All gyms', href }
  if (path === '/admin/gyms/bulk-import') return { label: 'Bulk import', href }
  if (path === '/admin/orphan-gyms') return { label: 'Claim links', href }
  if (path === '/admin/verification') return { label: 'Verification', href }
  if (path === '/admin/reviews') return { label: 'Reviews', href }
  if (path === '/admin/offers') return { label: 'Offers', href }
  if (path.startsWith('/admin/create-gym')) return { label: 'Create gym', href }
  if (path.startsWith('/admin')) return { label: 'Admin hub', href: '/admin' }

  if (path === '/manage') return { label: 'Dashboard', href: '/manage' }
  if (path.startsWith('/manage/')) return { label: 'Partner hub', href }

  return { label: 'Dashboard', href: '/manage' }
}
