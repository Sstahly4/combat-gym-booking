'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AffiliateInviteForm } from '@/components/admin/affiliate-invite-form'

export default function AdminNewAffiliatePage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/admin/affiliates"
        className="mb-4 inline-flex items-center text-sm text-stone-600 hover:text-stone-900"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to affiliates
      </Link>

      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Admin</p>
        <h1 className="mt-1 text-2xl font-semibold text-stone-900">Invite affiliate</h1>
        <p className="mt-2 text-sm text-stone-600">
          Pick their tier, generate a link, send it. They fill in everything else — name, email,
          referral code, and payout details.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New invite</CardTitle>
        </CardHeader>
        <CardContent>
          <AffiliateInviteForm />
        </CardContent>
      </Card>
    </main>
  )
}
