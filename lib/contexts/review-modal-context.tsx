'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import dynamic from 'next/dynamic'

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

const STORAGE_KEY = 'review_modal_restore'

// The URL params that encode modal state for sharing/deep-linking
const REVIEW_URL_PARAMS = ['review', 'pkg', 'checkin', 'checkout', 'guests', 'variant'] as const

// Serialise only the lightweight params (not bulky gymData/packageData) so
// sessionStorage stays small.
function saveRestoreParams(p: ReviewModalParams) {
  try {
    const { gymData: _g, packageData: _p, ...lite } = p
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(lite))
  } catch {}
}

function clearRestoreParams() {
  try { sessionStorage.removeItem(STORAGE_KEY) } catch {}
}

function readRestoreParams(): ReviewModalParams | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
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
  // Initialise synchronously — no useEffect delay, no flash on back-nav or
  // shared-link load. Priority: URL params (shared link) → sessionStorage (back-nav).
  const [params, setParams] = useState<ReviewModalParams | null>(() => {
    if (typeof window === 'undefined') return null
    const fromUrl = readUrlParams(gymId)
    if (fromUrl) return fromUrl
    // Only restore from sessionStorage if the stored params are for THIS gym.
    // Without this check, stale params from a previous gym bleed into every
    // subsequent gym page and cause the cover div to block all interactions.
    const stored = readRestoreParams()
    if (stored?.gymId === gymId) return stored
    return null
  })

  // Tracks whether the client has hydrated. Starts false on both server and
  // client so there is no hydration mismatch; flips to true after first paint.
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // Before hydration: show cover when the server detected review intent.
  // After hydration: show cover whenever the modal params are set (modal open or opening).
  // This ensures the gym page is never visible under the modal — not even for a frame.
  const showCover = mounted ? !!params : hasReviewIntent

  const openReviewModal = (p: ReviewModalParams) => {
    saveRestoreParams(p)
    pushReviewUrl(p)
    setParams(p)
  }

  const close = () => {
    clearRestoreParams()
    clearReviewUrl()
    setParams(null)
  }

  useEffect(() => {
    if (params) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [params])

  return (
    <ReviewModalContext.Provider value={{ openReviewModal }}>
      {children}
      {/* White cover prevents the gym page from showing through while the
          modal component lazy-loads. In SSR, hasReviewIntent puts this in
          the initial HTML so there is zero flash even on a fresh page load. */}
      {showCover && (
        <div className="fixed inset-0 z-[199] bg-white pointer-events-none" aria-hidden="true" />
      )}
      {params && (
        <ReviewModal params={params} gymSlugOrId={gymSlugOrId} onClose={close} />
      )}
    </ReviewModalContext.Provider>
  )
}
