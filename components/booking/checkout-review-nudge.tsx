'use client'

import { useCallback, useEffect, useState, type RefObject } from 'react'
import { cn } from '@/lib/utils'
import {
  dismissCheckoutReviewNudge,
  isCheckoutReviewNudgeDismissed,
} from '@/lib/utils/checkout-review-nudge'

/** Reserve space for the fixed FAB + safe area when testing visibility. */
const FAB_ZONE_PX = 104

function ReviewScrollArrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 14 22"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M7 2v13"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M3.5 13.5 7 17.5 10.5 13.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** How close to max scroll counts as "at the bottom" (iOS rubber-band tolerance). */
const SCROLL_BOTTOM_TOLERANCE_PX = 32

function isScrolledToBottom(root: HTMLElement): boolean {
  return root.scrollTop + root.clientHeight >= root.scrollHeight - SCROLL_BOTTOM_TOLERANCE_PX
}

function isCheckoutEndVisible(root: HTMLElement, end: HTMLElement): boolean {
  const rootRect = root.getBoundingClientRect()
  const endRect = end.getBoundingClientRect()
  const visibleBottom = rootRect.bottom - FAB_ZONE_PX
  return endRect.top <= visibleBottom && endRect.bottom >= rootRect.top
}

function shouldDismiss(root: HTMLElement, checkoutEnd: HTMLElement | null): boolean {
  if (isScrolledToBottom(root)) return true
  if (!checkoutEnd) return false
  return isCheckoutEndVisible(root, checkoutEnd)
}

export function CheckoutReviewNudge({
  bookingId,
  scrollRootRef,
  checkoutEndRef,
  ready = true,
}: {
  bookingId: string
  scrollRootRef: RefObject<HTMLElement | null>
  /** 1px sentinel at the bottom of mobile checkout content. */
  checkoutEndRef: RefObject<HTMLElement | null>
  /** When false, payment content below the fold is not mounted yet (e.g. Stripe loading). */
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
    let scrollStopTimer = 0
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
      const end = checkoutEndRef.current
      if (!root) return
      if (shouldDismiss(root, end)) dismiss()
    }

    const onScroll = () => {
      maybeDismiss()
      window.clearTimeout(scrollStopTimer)
      scrollStopTimer = window.setTimeout(maybeDismiss, 120)
    }

    const attach = () => {
      if (cancelled || dismissed) return

      const root = scrollRootRef.current
      const end = checkoutEndRef.current
      if (!root || !end) {
        raf = requestAnimationFrame(attach)
        return
      }

      maybeDismiss()

      root.addEventListener('scroll', onScroll, { passive: true })
      root.addEventListener('scrollend', maybeDismiss)

      try {
        observer = new IntersectionObserver(
          () => maybeDismiss(),
          {
            root,
            threshold: 0,
            rootMargin: `0px 0px -${FAB_ZONE_PX}px 0px`,
          },
        )
        observer.observe(end)
      } catch (err) {
        console.warn('[checkout-review-nudge] IntersectionObserver failed', err)
      }
    }

    attach()

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      window.clearTimeout(scrollStopTimer)
      observer?.disconnect()
      const root = scrollRootRef.current
      root?.removeEventListener('scroll', onScroll)
      root?.removeEventListener('scrollend', maybeDismiss)
    }
  }, [visible, ready, bookingId, scrollRootRef, checkoutEndRef])

  const handleClick = useCallback(() => {
    const root = scrollRootRef.current
    if (!root) return

    const maxScroll = Math.max(0, root.scrollHeight - root.clientHeight)
    root.scrollTo({ top: maxScroll, behavior: 'smooth' })
  }, [scrollRootRef])

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
          'pointer-events-auto flex items-center justify-center gap-3 rounded-full',
          'min-w-[9.5rem] bg-[#003580] px-8 py-4 text-base font-semibold text-white',
          'shadow-[0_2px_10px_rgba(0,0,0,0.14)]',
          'origin-bottom',
          leaving
            ? 'scale-95 opacity-0 transition-all duration-300 ease-in'
            : 'animate-checkout-review-nudge-enter',
        )}
      >
        <ReviewScrollArrow
          className="h-[1.375rem] w-[0.875rem] shrink-0 motion-reduce:animate-none animate-checkout-review-nudge-arrow"
        />
        Review
      </button>
    </div>
  )
}
