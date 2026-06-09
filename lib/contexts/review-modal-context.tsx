'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { LoadingOverlay } from '@/components/loading-overlay'
import { ReviewModalShell } from '@/components/booking/review-modal-shell'
import { hydrateReviewParams } from '@/lib/utils/booking-prefill'
import { useReviewCheckoutChrome } from '@/lib/contexts/review-checkout-chrome-context'
import {
  clearReviewModalRestore,
  readReviewModalRestore,
  writeReviewModalRestore,
} from '@/lib/utils/review-checkout-chrome'

export interface ReviewModalParams {
  gymId: string
  packageId: string
  variantId?: string
  checkin: string
  checkout: string
  guestCount?: number
  // Pre-loaded data from the gym page — passed in so the modal renders instantly
  // without a Supabase round-trip. Both are optional so the modal degrades gracefully.
  gymData?: Record<string, unknown>
  packageData?: Record<string, unknown>
  // Review stats already computed on the gym page — prevents star-rating flicker
  initialReviewCount?: number
  initialReviewAverage?: number
}

interface ReviewModalContextType {
  openReviewModal: (params: ReviewModalParams) => void
}

const ReviewModalContext = createContext<ReviewModalContextType | undefined>(undefined)

export function useReviewModal() {
  const ctx = useContext(ReviewModalContext)
  return ctx ?? { openReviewModal: () => {} }
}

const ReviewModal = dynamic(
  () => import('@/components/booking/review-modal').then((m) => m.ReviewModal),
  { ssr: false }
)

// The URL params that encode modal state for sharing/deep-linking
const REVIEW_URL_PARAMS = ['review', 'pkg', 'checkin', 'checkout', 'guests', 'variant'] as const

function saveRestoreParams(p: ReviewModalParams) {
  const { gymData: _g, packageData: _p, initialReviewCount: _c, initialReviewAverage: _a, ...lite } = p
  writeReviewModalRestore(lite)
}

/** Stamp review params into the address bar without adding a history entry. */
function pushReviewUrl(p: ReviewModalParams) {
  try {
    const url = new URL(window.location.href)
    url.searchParams.set('review', '1')
    url.searchParams.set('pkg', p.packageId)
    if (p.variantId) url.searchParams.set('variant', p.variantId)
    if (p.checkin) url.searchParams.set('checkin', p.checkin)
    if (p.checkout) url.searchParams.set('checkout', p.checkout)
    url.searchParams.set('guests', String(p.guestCount ?? 1))
    history.replaceState(null, '', url.toString())
  } catch {}
}

/** Strip review params from the address bar when the modal closes. */
function clearReviewUrl() {
  try {
    const url = new URL(window.location.href)
    REVIEW_URL_PARAMS.forEach((k) => url.searchParams.delete(k))
    history.replaceState(null, '', url.toString())
  } catch {}
}

/**
 * If the current URL has ?review=1&pkg=... open the modal immediately from
 * those params. gymId (UUID) is required so the modal can fall back to a
 * Supabase fetch when there is no pre-loaded prefill.
 */
function readUrlParams(gymId: string): ReviewModalParams | null {
  try {
    const sp = new URLSearchParams(window.location.search)
    if (sp.get('review') !== '1') return null
    const pkg = sp.get('pkg')
    if (!pkg) return null
    return {
      gymId,
      packageId: pkg,
      variantId: sp.get('variant') ?? undefined,
      checkin: sp.get('checkin') ?? '',
      checkout: sp.get('checkout') ?? '',
      guestCount: parseInt(sp.get('guests') ?? '1') || 1,
    }
  } catch {
    return null
  }
}

export function ReviewModalProvider({
  children,
  gymSlugOrId,
  gymId,
  hasReviewIntent = false,
}: {
  children: ReactNode
  gymSlugOrId: string
  /** Gym UUID — used when the modal is opened from a URL with no prefill data */
  gymId: string
  /**
   * Server-detected: true when the page was rendered with ?review=1&pkg=…
   * in the URL. Causes a white cover div to appear in the SSR HTML so the
   * gym page content is never visible while the modal is loading.
   */
  hasReviewIntent?: boolean
}) {
  const { hideReviewChrome, showReviewChrome } = useReviewCheckoutChrome()

  // Initialise synchronously — no useEffect delay, no flash on back-nav or
  // shared-link load. Priority: URL params (shared link) → sessionStorage (back-nav).
  const [params, setParams] = useState<ReviewModalParams | null>(() => {
    if (typeof window === 'undefined') return null
    const fromUrl = readUrlParams(gymId)
    if (fromUrl) return hydrateReviewParams(fromUrl)
    const stored = readReviewModalRestore()
    if (stored?.gymId === gymId) return hydrateReviewParams(stored)
    // Purge stale restore data from a different gym so it never re-triggers
    // a modal/cover on the wrong listing.
    if (stored) clearReviewModalRestore()
    return null
  })

  // Tracks whether the client has hydrated. Starts false on both server and
  // client so there is no hydration mismatch; flips to true after first paint.
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // Warm the modal chunk as soon as the provider mounts so back-nav feels instant.
  useEffect(() => {
    import('@/components/booking/review-modal')
  }, [])

  // True once the dynamically-imported modal chunk has loaded.
  const [modalChunkLoaded, setModalChunkLoaded] = useState(false)
  useEffect(() => {
    if (!params) {
      setModalChunkLoaded(false)
      return
    }
    let cancelled = false
    import('@/components/booking/review-modal').then(() => {
      if (!cancelled) setModalChunkLoaded(true)
    })
    return () => { cancelled = true }
  }, [params])

  // Shell paints instantly from prefill while the modal chunk loads.
  const showShell = !!params && !modalChunkLoaded

  // Cover only when we have no shell yet (SSR review intent before hydration).
  const showCover =
    !showShell && ((!mounted && hasReviewIntent) || (!!params && !modalChunkLoaded))

  const hideGymListing = !!params || hasReviewIntent

  const openReviewModal = (p: ReviewModalParams) => {
    const hydrated = hydrateReviewParams(p)
    saveRestoreParams(hydrated)
    hideReviewChrome()
    pushReviewUrl(hydrated)
    setParams(hydrated)
  }

  const close = () => {
    clearReviewModalRestore()
    showReviewChrome()
    clearReviewUrl()
    setParams(null)
  }

  useEffect(() => {
    if (params) {
      hideReviewChrome()
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [params, hideReviewChrome])

  return (
    <ReviewModalContext.Provider value={{ openReviewModal }}>
      <div className={hideGymListing ? 'hidden' : undefined} aria-hidden={hideGymListing}>
        {children}
      </div>
      <LoadingOverlay show={showCover} zClass="z-[199]" />
      {showShell && params && <ReviewModalShell params={params} />}
      {params && modalChunkLoaded && (
        <ReviewModal params={params} gymSlugOrId={gymSlugOrId} onClose={close} />
      )}
    </ReviewModalContext.Provider>
  )
}
