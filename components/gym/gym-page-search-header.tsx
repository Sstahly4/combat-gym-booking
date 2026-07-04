'use client'

import { SiteSearchHeaderStrip } from '@/components/site-search-header-strip'

export function GymPageSearchHeader({
  city,
  country,
}: {
  city: string
  country: string
}) {
  const initialQuery = [city, country].filter(Boolean).join(', ')
  return <SiteSearchHeaderStrip initialQuery={initialQuery} />
}
