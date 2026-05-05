'use client'

import { useLayoutEffect } from 'react'

/**
 * Prevents a brief "flash at bottom then jump to top" on mobile navigations where
 * the browser preserves a large scrollY from the previous page while the next
 * route is still streaming/layouting.
 */
export function ScrollToTopOnMount() {
  useLayoutEffect(() => {
    const prev = window.history.scrollRestoration
    try {
      window.history.scrollRestoration = 'manual'
    } catch {}

    // Run immediately and also on next frame to beat late layout shifts.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as any })
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as any })
      try {
        window.history.scrollRestoration = prev
      } catch {}
    })
  }, [])

  return null
}

