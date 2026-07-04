'use client'

import { useEffect } from 'react'
import { syncCheckoutStepHtmlFlag } from '@/lib/utils/review-checkout-chrome'

/** Enables the site navbar on desktop during dedicated checkout steps. */
export function useCheckoutDesktopHeader() {
  useEffect(() => {
    syncCheckoutStepHtmlFlag(true)
    return () => syncCheckoutStepHtmlFlag(false)
  }, [])
}
