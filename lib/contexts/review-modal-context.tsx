'use client'

import { createContext, useContext, useState, useEffect, ReactNode, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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

// ─── Auto-opener: reads ?reviewOpen=1 URL params and triggers the modal ──────
// Wrapped in its own component so useSearchParams can be Suspense-isolated.
function ReviewModalAutoOpener({ open }: { open: (p: ReviewModalParams) => void }) {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    if (searchParams.get('reviewOpen') !== '1') return
    const gymId = searchParams.get('gymId')
    const packageId = searchParams.get('packageId')
    if (!gymId || !packageId) return

    open({
      gymId,
      packageId,
      variantId: searchParams.get('variantId') ?? undefined,
      checkin: searchParams.get('checkin') ?? '',
      checkout: searchParams.get('checkout') ?? '',
      guestCount: parseInt(searchParams.get('guests') ?? '1', 10),
    })

    // Clean the review params from the URL so refreshing doesn't re-open the modal
    const clean = new URLSearchParams(searchParams.toString())
    clean.delete('reviewOpen')
    clean.delete('gymId')
    clean.delete('packageId')
    clean.delete('variantId')
    clean.delete('checkin')
    clean.delete('checkout')
    clean.delete('guests')
    const qs = clean.toString()
    router.replace(window.location.pathname + (qs ? `?${qs}` : ''), { scroll: false })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

export function ReviewModalProvider({
  children,
  gymSlugOrId,
}: {
  children: ReactNode
  gymSlugOrId: string
}) {
  const [params, setParams] = useState<ReviewModalParams | null>(null)

  const openReviewModal = (p: ReviewModalParams) => setParams(p)
  const close = () => setParams(null)

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
      <Suspense fallback={null}>
        <ReviewModalAutoOpener open={openReviewModal} />
      </Suspense>
      {params && (
        <ReviewModal params={params} gymSlugOrId={gymSlugOrId} onClose={close} />
      )}
    </ReviewModalContext.Provider>
  )
}
