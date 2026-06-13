'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AffiliateForm } from '@/components/admin/affiliate-form'

export default function AdminNewAffiliatePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/admin/affiliates"
        className="mb-4 inline-flex items-center text-sm text-stone-600 hover:text-stone-900"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to affiliates
      </Link>

      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Admin</p>
        <h1 className="mt-1 text-2xl font-semibold text-stone-900">Add affiliate</h1>
        <p className="mt-2 text-sm text-stone-600">
          Set their referral code and contact email. A secure payout setup link is generated
          automatically — send it privately so they enter their own bank or PayPal details.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Partner details</CardTitle>
        </CardHeader>
        <CardContent>
          <AffiliateForm mode="create" />
        </CardContent>
      </Card>
    </main>
  )
}
