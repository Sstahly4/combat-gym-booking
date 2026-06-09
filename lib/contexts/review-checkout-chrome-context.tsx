'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'
import {
  clearReviewCheckoutChromeHidden,
  isReviewCheckoutChromeHidden,
  setReviewCheckoutChromeHidden,
  syncReviewCheckoutChromeHtmlFlag,
} from '@/lib/utils/review-checkout-chrome'

interface ReviewCheckoutChromeContextType {
  isHidden: boolean
  hideReviewChrome: () => void
  showReviewChrome: () => void
}

const ReviewCheckoutChromeContext = createContext<ReviewCheckoutChromeContextType | undefined>(
  undefined
)

export function ReviewCheckoutChromeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [isHidden, setIsHidden] = useState(() => {
    if (typeof window === 'undefined') return false
    const hidden = isReviewCheckoutChromeHidden()
    syncReviewCheckoutChromeHtmlFlag(hidden)
    return hidden
  })

  const hideReviewChrome = useCallback(() => {
    setReviewCheckoutChromeHidden()
    setIsHidden(true)
    syncReviewCheckoutChromeHtmlFlag(true)
  }, [])

  const showReviewChrome = useCallback(() => {
    clearReviewCheckoutChromeHidden()
    setIsHidden(false)
    syncReviewCheckoutChromeHtmlFlag(false)
  }, [])

  // Keep in sync on route changes (back-nav, shared links).
  useEffect(() => {
    const hidden = isReviewCheckoutChromeHidden()
    setIsHidden(hidden)
    syncReviewCheckoutChromeHtmlFlag(hidden)
  }, [pathname])

  useLayoutEffect(() => {
    syncReviewCheckoutChromeHtmlFlag(isHidden)
  }, [isHidden])

  return (
    <ReviewCheckoutChromeContext.Provider value={{ isHidden, hideReviewChrome, showReviewChrome }}>
      {children}
    </ReviewCheckoutChromeContext.Provider>
  )
}

export function useReviewCheckoutChrome() {
  const ctx = useContext(ReviewCheckoutChromeContext)
  if (!ctx) {
    throw new Error('useReviewCheckoutChrome must be used within ReviewCheckoutChromeProvider')
  }
  return ctx
}

/** Whether global navbar/footer/mobile nav should be hidden for the review checkout flow. */
export function useIsReviewCheckoutChromeHidden(): boolean {
  return useReviewCheckoutChrome().isHidden
}
