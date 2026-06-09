import type { Metadata } from 'next'
import { ManageLayoutShell } from '@/components/manage/manage-layout-shell'
import { privateRouteMetadata } from '@/lib/seo/private-route-metadata'

export const metadata: Metadata = {
  ...privateRouteMetadata,
  title: 'Partner | CombatStay Partner Hub',
}

/** Owner portal relies on client hooks (e.g. search params); avoid static prerender errors. */
export const dynamic = 'force-dynamic'

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return <ManageLayoutShell>{children}</ManageLayoutShell>
}
