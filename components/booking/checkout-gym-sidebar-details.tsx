'use client'

import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import type { Gym, Package, PackageVariant } from '@/lib/types/database'
import { getFeaturedTrustSignal } from '@/components/booking-trust-line'
import { buildPackageInclusionLines } from '@/lib/booking/package-inclusions'
import { hasArrivalInfo, type ArrivalInfoGym } from '@/lib/booking/arrival-info'

function inclusionSummary(lines: string[], maxParts = 2): string {
  if (lines.length === 0) return ''
  if (lines.length <= maxParts) return lines.join(' · ')
  return `${lines.slice(0, maxParts).join(' · ')} +${lines.length - maxParts} more`
}

function isCancellationSignal(mainText: string): boolean {
  return mainText === 'Free cancellation' || mainText === 'Non-refundable'
}

type CheckoutGymSidebarDetailsProps = {
  package_: Package
  gym: Pick<Gym, 'amenities' | 'address' | 'city' | 'country' | 'training_schedule' | 'offers_accommodation'> &
    ArrivalInfoGym
  variant?: PackageVariant | null
  checkin: string
  checkoutStep?: 'details' | 'payment'
}

function SidebarDetailBlock({
  title,
  subtitle,
}: {
  title: string
  subtitle: ReactNode
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <p className="mt-0.5 text-xs text-gray-600 leading-relaxed">{subtitle}</p>
    </div>
  )
}

export function CheckoutGymSidebarDetails({
  package_,
  gym,
  variant = null,
  checkin,
  checkoutStep = 'details',
}: CheckoutGymSidebarDetailsProps) {
  if (!checkin) return null

  const trustSignal = getFeaturedTrustSignal(package_, gym, checkin)
  const inclusionLines = buildPackageInclusionLines(package_, gym, variant)
  const inclusionText = inclusionSummary(inclusionLines)
  const showInclusions =
    inclusionText.length > 0 &&
    (!trustSignal || isCancellationSignal(trustSignal.mainText))

  const arrivalSubtitle = hasArrivalInfo(gym)
    ? gym.address?.trim() || [gym.city, gym.country].filter(Boolean).join(', ')
    : null

  const paymentLine =
    checkoutStep === 'payment'
      ? 'Your card is held, not charged until the gym confirms your booking.'
      : "No payment needed now. You'll pay when the gym confirms your booking."

  const hasContent = trustSignal || showInclusions || arrivalSubtitle

  if (!hasContent && !paymentLine) return null

  return (
    <div className="space-y-3 pt-3 border-t border-gray-200">
      {trustSignal ? (
        <div>
          <p className="text-sm font-semibold text-gray-900">{trustSignal.mainText}</p>
          <p className="mt-0.5 text-xs text-gray-600 leading-relaxed">{trustSignal.subText}</p>
        </div>
      ) : null}

      {showInclusions ? (
        <SidebarDetailBlock title="What's included" subtitle={inclusionText} />
      ) : null}

      {arrivalSubtitle ? (
        <SidebarDetailBlock title="Arrival info" subtitle={arrivalSubtitle} />
      ) : null}

      <div className="flex items-start gap-2">
        <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" aria-hidden />
        <p className="text-xs text-gray-700 leading-relaxed">{paymentLine}</p>
      </div>
    </div>
  )
}
