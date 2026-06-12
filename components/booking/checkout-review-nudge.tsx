'use client'

import { useCallback, useEffect, useState, type RefObject } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  dismissCheckoutReviewNudge,
  isCheckoutReviewNudgeDismissed,
} from '@/lib/utils/checkout-review-nudge'

export function CheckoutReviewNudge({
  bookingId,
  scrollRootRef,
  dismissTarget,
  ready = true,
}: {
  bookingId: string
  scrollRootRef: RefObject<HTMLElement | null>
  /** Price details + confirm CTA block — observed for auto-dismiss. */
  dismissTarget: HTMLElement | null
  /** When false, the dismiss target is not mounted yet (e.g. Stripe still loading). */
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
    if (!visible || !ready || !dismissTarget || isCheckoutReviewNudgeDismissed(bookingId)) return

    const root = scrollRootRef.current
    if (!root) return

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
        if (!entry?.isIntersecting || entry.intersectionRatio < 0.1) return
        dismiss()
      },
      {
        root,
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
        // Shrink root bottom by ~nudge height so we dismiss once content is visible above the pill.
        rootMargin: '0px 0px -5rem 0px',
      },
    )

    observer.observe(dismissTarget)
    return () => observer.disconnect()
  }, [visible, ready, bookingId, scrollRootRef, dismissTarget])

  const handleClick = useCallback(() => {
    const root = scrollRootRef.current
    const target = dismissTarget
    if (!target) return
    if (root) {
      const rootTop = root.getBoundingClientRect().top
      const targetTop = target.getBoundingClientRect().top
      root.scrollTo({
        top: root.scrollTop + (targetTop - rootTop) - 16,
        behavior: 'smooth',
      })
      return
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [dismissTarget, scrollRootRef])

  if (!visible) return null

  return (
    <div
      className={cn(
        'md:hidden fixed inset-x-0 z-[280] flex justify-center pointer-events-none',
        'pb-[max(1.25rem,env(safe-area-inset-bottom))]'
      )}
      style={{ bottom: 0 }}
    >
      <button
        type="button"
        onClick={handleClick}
        aria-label="Scroll down to review payment and confirm booking"
        className={cn(
          'pointer-events-auto flex items-center justify-center gap-2 rounded-full',
          'bg-[#003580] px-6 py-3 text-sm font-semibold text-white',
          'shadow-[0_8px_24px_rgba(0,53,128,0.35)]',
          leaving
            ? 'scale-95 opacity-0 transition-all duration-300 ease-in'
            : 'animate-checkout-review-nudge-enter'
        )}
      >
        <ChevronDown
          className="h-4 w-4 motion-reduce:animate-none animate-checkout-review-nudge-arrow"
          aria-hidden
        />
        Review
      </button>
    </div>
  )
}
