import { subDays, parseISO, format } from 'date-fns'
import { ShieldCheck, AlertCircle } from 'lucide-react'

export interface BookingTrustLineProps {
  pkg: {
    cancellation_policy_days: number | null
    includes_accommodation?: boolean | null
    accommodation_name?: string | null
    includes_meals?: boolean | null
  }
  checkin: string
  className?: string
}

function getTrustSignal(
  pkg: BookingTrustLineProps['pkg'],
  checkin: string
): { text: string; icon: 'shield' | 'alert' | 'info' } {
  const cutoffDate =
    pkg.cancellation_policy_days != null && checkin
      ? subDays(parseISO(checkin), pkg.cancellation_policy_days)
      : null

  const hasFreeCancellation = cutoffDate !== null && new Date() < cutoffDate

  if (hasFreeCancellation) {
    return {
      text: `Free cancellation before ${format(cutoffDate, 'd MMM')}`,
      icon: 'shield',
    }
  }

  if (pkg.cancellation_policy_days !== null) {
    return {
      text: 'Non-refundable — cancellation policy applies',
      icon: 'alert',
    }
  }

  if (pkg.includes_accommodation) {
    return {
      text: `Accommodation included${pkg.accommodation_name ? ` — ${pkg.accommodation_name}` : ''}`,
      icon: 'info',
    }
  }

  if (pkg.includes_meals) {
    return { text: 'Meals included', icon: 'info' }
  }

  return { text: 'Training only package', icon: 'info' }
}

export function BookingTrustLine({ pkg, checkin, className = '' }: BookingTrustLineProps) {
  if (!checkin) return null

  const { text, icon } = getTrustSignal(pkg, checkin)

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {icon === 'shield' && (
        <ShieldCheck className="w-3.5 h-3.5 text-gray-400 shrink-0" />
      )}
      {icon === 'alert' && (
        <AlertCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />
      )}
      {icon === 'info' && (
        <ShieldCheck className="w-3.5 h-3.5 text-gray-400 shrink-0" />
      )}
      <span className="text-xs text-gray-500">{text}</span>
    </div>
  )
}
