'use client'

import { useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'

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

    // Reduce scroll anchoring surprises while the page height is still settling.
    try {
      document.documentElement.style.setProperty('overflow-anchor', 'none')
    } catch {}

    const hardScrollTop = () => {
      // `instant` is supported in modern browsers; fall back safely.
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
      } catch {
        window.scrollTo(0, 0)
      }
    }

    // Run immediately and also on next frame to beat late layout shifts.
    hardScrollTop()
    requestAnimationFrame(() => {
      hardScrollTop()
    })

    // iOS Safari can apply scroll restoration after first paint; repeat a few times.
    const t1 = window.setTimeout(hardScrollTop, 0)
    const t2 = window.setTimeout(hardScrollTop, 50)
    const t3 = window.setTimeout(hardScrollTop, 200)
    const t4 = window.setTimeout(hardScrollTop, 600)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
      window.clearTimeout(t4)
      try {
        window.history.scrollRestoration = prev
      } catch {}
      try {
        document.documentElement.style.removeProperty('overflow-anchor')
      } catch {}
    }
  }, [])

  return null
}

/**
 * Same behavior as `ScrollToTopOnMount`, but re-runs on pathname changes.
 * Useful for route segments where `loading.tsx` renders before the leaf page hydrates.
 */
export function ScrollToTopOnRoute() {
  const pathname = usePathname() ?? ''

  useLayoutEffect(() => {
    const prev = window.history.scrollRestoration
    try {
      window.history.scrollRestoration = 'manual'
    } catch {}

    try {
      document.documentElement.style.setProperty('overflow-anchor', 'none')
    } catch {}

    const hardScrollTop = () => {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
      } catch {
        window.scrollTo(0, 0)
      }
    }

    hardScrollTop()
    requestAnimationFrame(() => {
      hardScrollTop()
    })

    const t1 = window.setTimeout(hardScrollTop, 0)
    const t2 = window.setTimeout(hardScrollTop, 50)
    const t3 = window.setTimeout(hardScrollTop, 200)
    const t4 = window.setTimeout(hardScrollTop, 600)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
      window.clearTimeout(t4)
      try {
        window.history.scrollRestoration = prev
      } catch {}
      try {
        document.documentElement.style.removeProperty('overflow-anchor')
      } catch {}
    }
  }, [pathname])

  return null
}

