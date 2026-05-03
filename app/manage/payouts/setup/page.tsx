'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

/** Legacy URL: payout preferences and activity now live on Balances → Payouts. */
export default function ManagePayoutSetupRedirectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const gymId = searchParams.get('gym_id')?.trim() || ''

  useEffect(() => {
    const q = gymId ? `?gym_id=${encodeURIComponent(gymId)}` : ''
    router.replace(`/manage/balances/payouts${q}`)
  }, [router, gymId])

  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-white px-4">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Opening payouts…
      </div>
    </div>
  )
}
