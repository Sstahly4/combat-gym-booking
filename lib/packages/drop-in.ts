import type { CanonicalOfferType, Package } from '@/lib/types/database'
import {
  normalizeTrainingAccess,
  type PackageTrainingAccess,
} from '@/lib/packages/training-access'

export type DropInSessionOption = 'single' | 'double'

export const DROP_IN_OFFER_TYPE = 'TYPE_DROP_IN' as const satisfies CanonicalOfferType

export const DEFAULT_DROP_IN_SESSION: DropInSessionOption = 'single'

export const DEFAULT_DROP_IN_BOOKING_MODE = 'instant' as const

export function isDropInPackage(
  pkg: { offer_type?: string | null } | null | undefined
): boolean {
  return pkg?.offer_type === DROP_IN_OFFER_TYPE
}

export function dropInSessionFromTrainingAccess(
  access: PackageTrainingAccess | null | undefined
): DropInSessionOption {
  const normalized = normalizeTrainingAccess(access)
  return normalized === 'twice_daily' ? 'double' : 'single'
}

export function trainingAccessFromDropInSession(
  session: DropInSessionOption
): 'once_daily' | 'twice_daily' {
  return session === 'double' ? 'twice_daily' : 'once_daily'
}

export function dropInSessionLabel(session: DropInSessionOption): string {
  return session === 'double' ? 'Double Session' : 'Single Session'
}

export function dropInSessionDescription(session: DropInSessionOption): string {
  return session === 'double'
    ? 'Morning and evening sessions on the visit day.'
    : 'One session on the visit day — guest picks morning or evening.'
}

export function dropInSessionCardLabel(
  access: PackageTrainingAccess | null | undefined
): string {
  return dropInSessionLabel(dropInSessionFromTrainingAccess(access))
}

/** Drop-in bookings use same calendar day for check-in and check-out. */
export function isDropInSameDayBooking(startDate: string, endDate: string): boolean {
  return startDate === endDate
}

export function validateDropInBookingDates(
  offerType: string | null | undefined,
  startDate: string,
  endDate: string
): string | null {
  if (!isDropInPackage({ offer_type: offerType })) return null
  if (!isDropInSameDayBooking(startDate, endDate)) {
    return 'Drop-in bookings must be for a single visit day (same check-in and check-out date).'
  }
  return null
}
