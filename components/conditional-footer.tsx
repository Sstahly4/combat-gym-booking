'use client'

import { usePathname } from 'next/navigation'
import { Footer } from '@/components/footer'
import { useIsReviewCheckoutChromeHidden } from '@/lib/contexts/review-checkout-chrome-context'

/** Omits the global footer on hub dashboards and checkout steps (focused flow, no site chrome). */
export function ConditionalFooter() {
  const pathname = usePathname() ?? ''
  const reviewChromeHidden = useIsReviewCheckoutChromeHidden()

  const isCheckoutStep =
    pathname === '/bookings/summary' ||
    /^\/bookings\/[^/]+\/payment/.test(pathname)

  if (
    pathname === '/manage' ||
    pathname.startsWith('/manage/') ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/bookings/review') ||
    isCheckoutStep ||
    reviewChromeHidden
  ) {
    return null
  }

  const isSavedRoute = pathname === '/saved' || pathname.startsWith('/saved/')

  return (
    <div className={isSavedRoute ? 'hidden md:block' : undefined}>
      <Footer />
    </div>
  )
}
