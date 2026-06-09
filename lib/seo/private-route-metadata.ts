import type { Metadata } from 'next'

/** Shared noindex metadata for authenticated / transactional routes. */
export const privateRouteMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}
