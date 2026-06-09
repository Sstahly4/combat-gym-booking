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

export function ReviewModalProvider({
  children,
  gymSlugOrId,
}: {
  children: ReactNode
  gymSlugOrId: string
}) {
  // Initialise synchronously from sessionStorage so the modal renders on the
  // very first paint when the user navigates back — no useEffect delay, no flash.
  const [params, setParams] = useState<ReviewModalParams | null>(() => {
    if (typeof window === 'undefined') return null
    return readRestoreParams()
  })

  const openReviewModal = (p: ReviewModalParams) => {
    saveRestoreParams(p)
    setParams(p)
  }

  const close = () => {
    clearRestoreParams()
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
      {params && (
        <ReviewModal params={params} gymSlugOrId={gymSlugOrId} onClose={close} />
      )}
    </ReviewModalContext.Provider>
  )
}
