'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AffiliateForm, type AffiliateFormValues } from '@/components/admin/affiliate-form'

export default function AdminEditAffiliatePage() {
  const params = useParams()
  const id = params.id as string
  const [initial, setInitial] = useState<Partial<AffiliateFormValues> | null>(null)
  const [referralUrl, setReferralUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/affiliates/${id}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to load')
        return
      }
      const a = data.affiliate
      setInitial({
        name: a.name,
        email: a.email,
        code: a.code,
        tier: a.tier,
        payout_details: a.payout_details,
        notes: a.notes || '',
        status: a.status,
      })
      setReferralUrl(a.referral_url)
    }
    load()
  }, [id])

  if (error) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-red-600">{error}</p>
      </main>
    )
  }

  if (!initial) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-stone-500">Loading…</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href={`/admin/affiliates/${id}`}
        className="mb-4 inline-flex items-center text-sm text-stone-600 hover:text-stone-900"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to profile
      </Link>

      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Admin</p>
        <h1 className="mt-1 text-2xl font-semibold text-stone-900">Edit affiliate</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{initial.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <AffiliateForm
            mode="edit"
            affiliateId={id}
            initial={initial}
            savedReferralUrl={referralUrl}
          />
        </CardContent>
      </Card>
    </main>
  )
}
