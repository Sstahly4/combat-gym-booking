'use client'

/**
 * Client shell for the admin dashboard.
 *
 * - Enforces admin-only access (redirects non-admins, shows a friendly fallback
 *   for signed-out users) so each child page stops repeating that boilerplate.
 * - Fetches lightweight pending counts for the sidebar badges (verification +
 *   orphan claim links). One query each, every time we land on /admin/*.
 */
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { formatHubDocumentTitle } from '@/lib/metadata/site-hubs'

interface SidebarCounts {
  verification?: number
  orphan?: number
}

function adminSectionTitle(pathname: string): string {
  if (pathname === '/admin') return 'Overview'
  if (pathname.startsWith('/admin/verification')) return 'Verification'
  if (pathname.startsWith('/admin/gyms/bulk-import')) return 'Bulk import'
  if (pathname.startsWith('/admin/gyms')) return 'All gyms'
  if (pathname.startsWith('/admin/orphan-gyms')) return 'Claim links'
  if (pathname.startsWith('/admin/reviews')) return 'Reviews'
  if (pathname.startsWith('/admin/offers')) return 'Offers'
  if (pathname.startsWith('/admin/create-gym')) return 'Create gym'
  return 'Admin'
}

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname() ?? ''
  const { user, profile, loading: authLoading } = useAuth()
  const [counts, setCounts] = useState<SidebarCounts>({})

  useEffect(() => {
    if (authLoading) return
    if (!user) return
    if (profile?.role !== 'admin') return

    let cancelled = false
    async function loadCounts() {
      try {
        const supabase = createClient()
        const verResult = await supabase
          .from('gyms')
          .select('id', { count: 'exact', head: true })
          .eq('verification_status', 'draft')

        let orphanCount = 0
        try {
          const res = await fetch('/api/admin/orphan-gyms', { cache: 'no-store' })
          if (res.ok) {
            const data = await res.json()
            orphanCount = Array.isArray(data?.gyms) ? data.gyms.length : 0
          }
        } catch {
          // Best-effort; leave at 0 if endpoint not yet deployed.
        }

        if (cancelled) return
        setCounts({
          verification: verResult.count ?? 0,
          orphan: orphanCount,
        })
      } catch (err) {
        if (!cancelled) console.warn('[admin-layout] failed to load badge counts', err)
      }
    }
    loadCounts()
    return () => {
      cancelled = true
    }
  }, [authLoading, user, profile?.role])

  useEffect(() => {
    if (!pathname.startsWith('/admin')) return
    const section = adminSectionTitle(pathname)
    document.title = formatHubDocumentTitle(section, 'admin')
  }, [pathname])

  if (authLoading) {
    return (
      <div className="flex min-h-[60svh] items-center justify-center text-sm text-stone-500">
        Loading…
      </div>
    )
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-stone-900">Sign in to continue</h1>
        <p className="mt-2 text-sm text-stone-600">
          You need to be signed in as an admin to use this dashboard.
        </p>
        <button
          onClick={() => router.push('/auth/signin?redirect=/admin')}
          className="mt-6 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
        >
          Sign in
        </button>
      </main>
    )
  }

  if (profile?.role !== 'admin') {
    return (
      <main className="mx-auto max-w-xl px-6 py-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Access denied</p>
        <h1 className="mt-1 text-2xl font-semibold text-stone-900">Admins only</h1>
        <p className="mt-2 text-sm text-stone-600">
          This area is restricted to platform admins. If you think this is a
          mistake, ask the team to update your role.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-50"
        >
          Back to homepage
        </Link>
      </main>
    )
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-white md:block md:min-h-[calc(100svh-5rem)]">
      <AdminSidebar counts={counts} />
      <div
        data-admin-hub-main-scroll
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden md:ml-56 md:h-[calc(100svh-5rem)] md:max-h-[calc(100svh-5rem)] md:overflow-y-auto"
      >
        {children}
      </div>
    </div>
  )
}
