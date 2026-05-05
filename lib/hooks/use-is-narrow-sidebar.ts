'use client'

import { useEffect, useState } from 'react'

/** Matches Tailwind `md` (768px) — sidebar drawer pattern below this width. */
const QUERY = '(max-width: 767px)'

export function useIsNarrowForManageSidebar(): boolean {
  const [narrow, setNarrow] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const sync = () => setNarrow(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return narrow
}
