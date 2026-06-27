import Link from 'next/link'
import { ArrowRight, Dumbbell, Plane } from 'lucide-react'
import type { SupportAudience } from '@/components/help/support-hub-links'

export function SupportAudienceSwitcher({ active }: { active: SupportAudience }) {
  const isTraveler = active === 'traveler'

  return (
    <div className="mb-8 flex flex-col gap-4 rounded-lg border border-gray-200 bg-gradient-to-r from-slate-50 to-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0052CC]/10 text-[#0052CC]">
          {isTraveler ? <Plane className="h-5 w-5" aria-hidden /> : <Dumbbell className="h-5 w-5" aria-hidden />}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {isTraveler ? 'Booking a training trip?' : 'Running a gym on CombatStay?'}
          </p>
          <p className="mt-0.5 text-sm text-gray-600">
            {isTraveler
              ? 'You are in the traveler help center — bookings, payments, and safety for guests.'
              : 'You are in the partner help center — listings, payouts, and the Partner Hub.'}
          </p>
        </div>
      </div>
      <Link
        href={isTraveler ? '/owners/help' : '/faq'}
        className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#0052CC] hover:underline"
      >
        {isTraveler ? 'Switch to partner help' : 'Switch to traveler FAQ'}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  )
}
