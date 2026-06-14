'use client'

import { useCallback, useEffect, useState, type RefObject } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  dismissCheckoutReviewNudge,
  isCheckoutReviewNudgeDismissed,
} from '@/lib/utils/checkout-review-nudge'

/** Ignore dismiss until the guest has scrolled down from the page top. */
const MIN_SCROLL_BEFORE_DISMISS_PX = 40

function shouldDismissForConfirmCta(root: HTMLElement, target: HTMLElement): boolean {
  if (root.scrollTop < MIN_SCROLL_BEFORE_DISMISS_PX) return false

  const rootRect = root.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()
  const overlapTop = Math.max(targetRect.top, rootRect.top)
  const overlapBottom = Math.min(targetRect.bottom, rootRect.bottom)
  const visibleHeight = overlapBottom - overlapTop
  if (visibleHeight < 36) return false

  const targetHeight = Math.max(targetRect.height, 1)
  return visibleHeight / targetHeight >= 0.55
}

export function CheckoutReviewNudge({
  bookingId,
  scrollRootRef,
  dismissAnchorRef,
  ready = true,
}: {
  bookingId: string
  scrollRootRef: RefObject<HTMLElement | null>
  /** Confirm booking CTA row only — not price details or consent copy. */
  dismissAnchorRef: RefObject<HTMLElement | null>
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
    if (!visible || !ready || isCheckoutReviewNudgeDismissed(bookingId)) return

    let dismissed = false
    let observer: IntersectionObserver | null = null
    let raf = 0
    let cancelled = false

    const dismiss = () => {
      if (dismissed || isCheckoutReviewNudgeDismissed(bookingId)) return
      dismissed = true
      dismissCheckoutReviewNudge(bookingId)
      setLeaving(true)
      window.setTimeout(() => setVisible(false), 280)
    }

    const maybeDismiss = () => {
      const root = scrollRootRef.current
      const target = dismissAnchorRef.current
      if (!root || !target) return
      if (shouldDismissForConfirmCta(root, target)) dismiss()
    }

    const attach = () => {
      if (cancelled || dismissed) return

      const root = scrollRootRef.current
      const target = dismissAnchorRef.current
      if (!root || !target) {
        raf = requestAnimationFrame(attach)
        return
      }

      root.addEventListener('scroll', maybeDismiss, { passive: true })

      try {
        observer = new IntersectionObserver(() => maybeDismiss(), {
          root,
          threshold: [0, 0.25, 0.55, 0.75, 1],
          rootMargin: '0px 0px -12% 0px',
        })
        observer.observe(target)
      } catch (err) {
        console.warn('[checkout-review-nudge] IntersectionObserver failed', err)
      }
    }

    attach()

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      observer?.disconnect()
      scrollRootRef.current?.removeEventListener('scroll', maybeDismiss)
    }
  }, [visible, ready, bookingId, scrollRootRef, dismissAnchorRef])

  const handleClick = useCallback(() => {
    const root = scrollRootRef.current
    const target = dismissAnchorRef.current
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
  }, [dismissAnchorRef, scrollRootRef])

  if (!visible) return null

  return (
    <div
      className={cn(
        'md:hidden fixed inset-x-0 z-[280] flex justify-center pointer-events-none',
        'pb-[max(1.25rem,env(safe-area-inset-bottom))]',
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
            : 'animate-checkout-review-nudge-enter',
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
