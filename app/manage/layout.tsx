import type { Metadata } from 'next'
import { ManageLayoutShell } from '@/components/manage/manage-layout-shell'

export const metadata: Metadata = {
  title: 'Partner | Combatbooking Partner Hub',
}

/** Owner portal relies on client hooks (e.g. search params); avoid static prerender errors. */
export const dynamic = 'force-dynamic'

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return <ManageLayoutShell>{children}</ManageLayoutShell>
}
