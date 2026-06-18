'use client'

import { Suspense, useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { looksLikeUuid } from '@/lib/utils/gym-route'

/** Canonical slug redirect for legacy UUID gym URLs (preserves query string). */
function GymSlugRedirect({ slug }: { slug: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const segment = pathname.split('/').pop()
    if (!segment || !looksLikeUuid(segment) || !slug) return
    const qs = searchParams.toString()
    router.replace(`/gyms/${slug}${qs ? `?${qs}` : ''}`)
  }, [pathname, router, searchParams, slug])

  return null
}

export function GymSlugRedirectBoundary({ slug }: { slug: string }) {
  return (
    <Suspense fallback={null}>
      <GymSlugRedirect slug={slug} />
    </Suspense>
  )
}
