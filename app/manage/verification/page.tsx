'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { VerificationChecklist } from '@/components/verification-checklist'
import { buildOnboardingWizardUrl } from '@/lib/onboarding/owner-wizard'
import { ManageBreadcrumbs } from '@/components/manage/manage-breadcrumbs'
import type { Gym } from '@/lib/types/database'

export default function ManageVerificationPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [gym, setGym] = useState<Gym | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/auth/signin')
      return
    }
    if (!profile) {
      router.replace('/auth/role-selection')
      return
    }
    if (profile.role !== 'owner') {
      router.replace('/')
      return
    }

    const load = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('gyms')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error(error)
        setGym(null)
      } else {
        setGym((data?.[0] as Gym) ?? null)
      }
      setLoading(false)
    }
    void load()
  }, [user, profile, authLoading, router])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-100" />
          <div className="mt-6 h-64 animate-pulse rounded-xl bg-gray-100" />
        </div>
      </div>
    )
  }

  if (!gym) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <ManageBreadcrumbs items={[{ label: 'Dashboard', href: '/manage' }, { label: 'Verification' }]} />
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">Verification</h1>
          <p className="mt-1 text-sm text-gray-500">Create a gym profile to see verification requirements.</p>
          <Link
            href={buildOnboardingWizardUrl('step-1', null)}
            className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-[#003580] px-4 text-sm font-medium text-white transition-colors hover:bg-[#002a66]"
          >
            Create gym profile
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <ManageBreadcrumbs items={[{ label: 'Dashboard', href: '/manage' }, { label: 'Verification' }]} />
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">Verification</h1>
        <p className="mt-1 max-w-3xl text-sm text-gray-500">
          Complete each step so your gym can go live — including the{' '}
          <strong className="font-medium text-gray-700">Partner Agreement</strong> under{' '}
          <strong className="font-medium text-gray-700">Settings → Payouts</strong>. Progress saves as you edit your
          profile and set up payouts.
        </p>
        <div className="mt-6 sm:mt-8">
          <VerificationChecklist gym={gym} />
        </div>
      </div>
    </div>
  )
}
