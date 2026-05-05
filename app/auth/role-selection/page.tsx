'use client'

/**
 * Legacy URL: we no longer ask users to pick fighter vs owner on a dedicated screen.
 * Infer role from signup/OAuth metadata, create a minimal profile if needed, then redirect.
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { useBootstrapProfileIfMissing } from '@/lib/hooks/use-bootstrap-profile-if-missing'
import { resolveOwnerListingHubPath } from '@/lib/manage/resolve-owner-hub-url'

export default function RoleSelectionRedirectPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading, refreshProfile } = useAuth()

  const profileRecoverFailed = useBootstrapProfileIfMissing({
    authLoading,
    user,
    profile,
    refreshProfile,
  })

  useEffect(() => {
    if (authLoading || profileRecoverFailed) return
    if (!user) {
      router.replace('/auth/signin')
      return
    }
    if (!profile) return

    void (async () => {
      if (profile.role === 'admin') {
        router.replace('/admin')
        return
      }
      if (profile.role === 'owner') {
        const supabase = createClient()
        const dest = await resolveOwnerListingHubPath(supabase, user.id)
        router.replace(dest)
        return
      }
      router.replace('/dashboard')
    })()
  }, [authLoading, user, profile, router, profileRecoverFailed])

  useEffect(() => {
    if (profileRecoverFailed) {
      router.replace('/auth/signin')
    }
  }, [profileRecoverFailed, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#003580] border-t-transparent" aria-hidden />
      <span className="sr-only">Redirecting…</span>
    </div>
  )
}
