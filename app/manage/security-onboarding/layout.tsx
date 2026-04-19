import type { ReactNode } from 'react'

/** Avoid stale CDN/browser caching of this flow while iterating. */
export const dynamic = 'force-dynamic'

export default function SecurityOnboardingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
