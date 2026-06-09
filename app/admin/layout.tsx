import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { AdminLayoutShell } from '@/components/admin/admin-layout-shell'
import { privateRouteMetadata } from '@/lib/seo/private-route-metadata'

export const metadata: Metadata = {
  ...privateRouteMetadata,
  title: 'Admin | CombatStay Admin Hub',
}

export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>
}
