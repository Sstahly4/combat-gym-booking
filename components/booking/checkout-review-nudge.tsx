'use client'

import { useCallback, useEffect, useState, type RefObject } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  dismissCheckoutReviewNudge,
  isCheckoutReviewNudgeDismissed,
} from '@/lib/utils/checkout-review-nudge'

export function CheckoutReviewNudge({
  bookingId,
  scrollRootRef,
  confirmCtaRef,
  ready = true,
}: {
  bookingId: string
  scrollRootRef: RefObject<HTMLElement | null>
  confirmCtaRef: RefObject<HTMLElement | null>
  /** When false, the confirm CTA is not mounted yet (e.g. Stripe still loading). */
  ready?: boolean
}) {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!bookingId || isCheckoutReviewNudgeDismissed(bookingId)) return
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [bookingId])

  useEffect(() => {
    if (!visible || !ready || isCheckoutReviewNudgeDismissed(bookingId)) return

    const target = confirmCtaRef.current
    if (!target) return

    let dismissed = false
    const dismiss = () => {
      if (dismissed || isCheckoutReviewNudgeDismissed(bookingId)) return
      dismissed = true
      dismissCheckoutReviewNudge(bookingId)
      setLeaving(true)
      window.setTimeout(() => setVisible(false), 280)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) dismiss()
      },
      {
        root: scrollRootRef.current,
        threshold: 0.12,
      }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [visible, ready, bookingId, scrollRootRef, confirmCtaRef])

  const handleClick = useCallback(() => {
    confirmCtaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [confirmCtaRef])

  if (!visible) return null

  return (
    <div
      className={cn(
        'md:hidden sticky top-0 z-20 -mx-4 px-4 pt-1 pb-2',
        'bg-gradient-to-b from-white from-70% to-transparent pointer-events-none'
      )}
    >
      <button
        type="button"
        onClick={handleClick}
        aria-label="Scroll to review payment and confirm booking"
        className={cn(
          'pointer-events-auto mx-auto flex items-center justify-center gap-2 rounded-full',
          'bg-[#003580] px-5 py-2.5 text-sm font-semibold text-white',
          'shadow-lg shadow-[#003580]/20',
          leaving
            ? 'scale-95 opacity-0 transition-all duration-300 ease-in'
            : 'animate-checkout-review-nudge-enter'
        )}
      >
        <ArrowUp
          className="h-4 w-4 motion-reduce:animate-none animate-checkout-review-nudge-arrow"
          aria-hidden
        />
        Review
      </button>
    </div>
  )
}
