'use client'

import type { ReactNode } from 'react'
import { differenceInCalendarDays } from 'date-fns'
import type { Booking, Gym } from '@/lib/types/database'
import type { CancellationPolicySnapshot } from '@/lib/booking/cancellation-policy'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatDashboardMoney } from '@/lib/currency/format-dashboard-money'
import { canonicalBookingStatusLabel, toCanonicalBookingStatus } from '@/lib/bookings/status-normalization'
import { cn } from '@/lib/utils'

export type OwnerBookingAccommodation = {
  id: string
  name: string | null
  description: string | null
  room_type: 'private' | 'shared' | 'dorm' | null
  capacity: number | null
}

export type OwnerBookingVariant = {
  id: string
  name: string | null
  description?: string | null
  room_type?: 'private' | 'shared' | null
  capacity?: number | null
  accommodation_id?: string | null
  accommodation?: OwnerBookingAccommodation | null
}

export type OwnerBookingRow = Booking & {
  gym: Gym
  package: {
    id: string
    name: string | null
    sport?: string | null
    offer_type?: string | null
    includes_accommodation?: boolean | null
    accommodation_name?: string | null
  } | null
  variant: OwnerBookingVariant | null
}

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

function formatLongDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

function experienceLabel(level: string | null | undefined): string {
  if (!level) return '—'
  return level.charAt(0).toUpperCase() + level.slice(1)
}

function trainingTierLabel(tier: string | null | undefined): string | null {
  if (tier === 'once_daily') return 'Once daily'
  if (tier === 'twice_daily') return 'Twice daily'
  return null
}

function roomTypeLabel(roomType: string | null | undefined): string | null {
  if (!roomType) return null
  if (roomType === 'private') return 'Private room'
  if (roomType === 'shared') return 'Shared room'
  if (roomType === 'dorm') return 'Dorm'
  return roomType.charAt(0).toUpperCase() + roomType.slice(1)
}

function offerTypeLabel(offerType: string | null | undefined): string | null {
  if (!offerType) return null
  const map: Record<string, string> = {
    TYPE_TRAINING_ONLY: 'Training only',
    TYPE_ALL_INCLUSIVE: 'All inclusive (training + stay)',
    TYPE_ACCOMMODATION_ONLY: 'Accommodation only',
    TYPE_ONE_TIME_EVENT: 'One-time event',
    TYPE_DROP_IN: 'Drop-in',
  }
  return map[offerType] || offerType.replace(/^TYPE_/, '').replace(/_/g, ' ').toLowerCase()
}

function resolveAccommodation(booking: OwnerBookingRow): {
  name: string | null
  roomType: string | null
  capacity: number | null
  description: string | null
  source: 'accommodation' | 'variant' | 'package' | null
} {
  const acc = booking.variant?.accommodation
  if (acc?.name || acc?.description || acc?.room_type) {
    return {
      name: acc.name,
      roomType: acc.room_type,
      capacity: acc.capacity,
      description: acc.description,
      source: 'accommodation',
    }
  }
  if (booking.variant?.name || booking.variant?.room_type || booking.variant?.description) {
    // Variant often IS the room choice for all-inclusive packages.
    const looksLikeRoom =
      Boolean(booking.variant.accommodation_id) ||
      Boolean(booking.variant.room_type) ||
      Boolean(booking.package?.includes_accommodation) ||
      Boolean(booking.package?.offer_type?.includes('INCLUSIVE')) ||
      Boolean(booking.package?.offer_type?.includes('ACCOMMODATION'))
    if (looksLikeRoom) {
      return {
        name: booking.variant.name,
        roomType: booking.variant.room_type ?? null,
        capacity: booking.variant.capacity ?? null,
        description: booking.variant.description ?? null,
        source: 'variant',
      }
    }
  }
  if (booking.package?.accommodation_name) {
    return {
      name: booking.package.accommodation_name,
      roomType: null,
      capacity: null,
      description: null,
      source: 'package',
    }
  }
  return { name: null, roomType: null, capacity: null, description: null, source: null }
}

function statusBadgeClass(c: ReturnType<typeof toCanonicalBookingStatus>): string {
  switch (c) {
    case 'pending':
      return 'bg-amber-50 text-amber-900 ring-amber-200'
    case 'confirmed':
      return 'bg-sky-50 text-sky-900 ring-sky-200'
    case 'paid':
      return 'bg-emerald-50 text-emerald-900 ring-emerald-200'
    case 'completed':
      return 'bg-gray-100 text-gray-800 ring-gray-200'
    case 'declined':
    case 'cancelled':
      return 'bg-red-50 text-red-900 ring-red-200'
    default:
      return 'bg-gray-100 text-gray-800 ring-gray-200'
  }
}

function DetailBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{title}</h3>
      <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3.5 text-sm text-gray-800">
        {children}
      </div>
    </section>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-1.5 first:pt-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <span className="shrink-0 text-xs font-normal text-gray-500">{label}</span>
      <span className="min-w-0 text-left text-sm font-medium text-gray-900 sm:text-right">{value}</span>
    </div>
  )
}

export function OwnerBookingDetailDialog({
  booking,
  open,
  onOpenChange,
  actionLoadingId,
  onAccept,
  onDeclineRequest,
  onCapture,
  onCancelBooking,
}: {
  booking: OwnerBookingRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  actionLoadingId: string | null
  onAccept: (id: string) => void
  onDeclineRequest: (id: string) => void
  onCapture: (id: string) => void
  onCancelBooking: (id: string) => void
}) {
  if (!booking) return null

  const canonical = toCanonicalBookingStatus(booking.status)
  const label = canonicalBookingStatusLabel(canonical)
  const currency = booking.gym.currency || 'USD'
  const start = parseYmd(booking.start_date.slice(0, 10))
  const end = parseYmd(booking.end_date.slice(0, 10))
  const nights = Math.max(0, differenceInCalendarDays(end, start))
  const totalFmt = formatDashboardMoney(Number(booking.total_price) || 0, currency, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const feeFmt = formatDashboardMoney(Number(booking.platform_fee) || 0, currency, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const payout = Math.max(0, (Number(booking.total_price) || 0) - (Number(booking.platform_fee) || 0))
  const payoutFmt = formatDashboardMoney(payout, currency, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const snap = booking.cancellation_policy_snapshot as CancellationPolicySnapshot | null | undefined
  const policyName =
    snap && typeof snap === 'object' && 'policyDisplayName' in snap ? snap.policyDisplayName : null

  const loading = actionLoadingId === booking.id
  const stay = resolveAccommodation(booking)
  const tierLabel = trainingTierLabel(booking.training_tier)
  const offerLabel = offerTypeLabel(booking.package?.offer_type)
  const roomLabel = roomTypeLabel(stay.roomType)
  const hasAccommodation = Boolean(stay.name || stay.description || stay.roomType)

  return (
    <Dialog open={open} onOpenChange={onOpenChange} stackClassName="z-[120]">
      <DialogContent className="max-h-[min(92vh,840px)] max-w-2xl overflow-y-auto border border-gray-200/90 bg-white p-0 shadow-xl">
        <div className="border-b border-gray-100 px-6 py-5">
          <DialogHeader className="space-y-3 text-left">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <DialogTitle className="text-xl font-semibold tracking-tight text-gray-900">
                {booking.guest_name?.trim() || 'Guest'}
              </DialogTitle>
              <span
                className={cn(
                  'inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                  statusBadgeClass(canonical)
                )}
              >
                {label}
              </span>
            </div>
            <p className="text-sm font-normal text-gray-500">
              {booking.gym.name}
              {booking.booking_reference ? (
                <>
                  {' '}
                  · Ref <span className="font-mono tabular-nums">{booking.booking_reference}</span>
                </>
              ) : null}
            </p>
            {hasAccommodation || booking.package?.name ? (
              <p className="text-sm font-medium text-gray-800">
                {booking.package?.name || 'Booking'}
                {stay.name ? (
                  <span className="font-normal text-gray-600">
                    {' '}
                    · {stay.name}
                  </span>
                ) : null}
                {tierLabel ? (
                  <span className="font-normal text-gray-500">
                    {' '}
                    · {tierLabel} training
                  </span>
                ) : null}
              </p>
            ) : null}
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 py-6">
          <DetailBlock title="Stay dates">
            <div className="divide-y divide-gray-100">
              <Row
                label="Check-in"
                value={<span className="tabular-nums">{formatLongDate(start)}</span>}
              />
              <Row
                label="Check-out"
                value={<span className="tabular-nums">{formatLongDate(end)}</span>}
              />
              <Row label="Nights" value={<span className="tabular-nums">{nights}</span>} />
            </div>
          </DetailBlock>

          {hasAccommodation ? (
            <DetailBlock title="Accommodation">
              <div className="divide-y divide-gray-100">
                <Row label="Room" value={stay.name || '—'} />
                {roomLabel ? <Row label="Room type" value={roomLabel} /> : null}
                {stay.capacity != null ? (
                  <Row
                    label="Capacity"
                    value={
                      <span className="tabular-nums">
                        {stay.capacity} {stay.capacity === 1 ? 'guest' : 'guests'}
                      </span>
                    }
                  />
                ) : null}
              </div>
              {stay.description ? (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <p className="mb-1.5 text-xs font-normal text-gray-500">What’s included</p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                    {stay.description}
                  </p>
                </div>
              ) : null}
            </DetailBlock>
          ) : null}

          <DetailBlock title="Training & package">
            <div className="divide-y divide-gray-100">
              <Row label="Discipline" value={booking.discipline || '—'} />
              <Row label="Experience" value={experienceLabel(booking.experience_level)} />
              <Row label="Package" value={booking.package?.name || '—'} />
              {offerLabel ? <Row label="Package type" value={offerLabel} /> : null}
              {tierLabel ? <Row label="Training access" value={tierLabel} /> : null}
              {booking.package?.sport ? <Row label="Sport" value={booking.package.sport} /> : null}
              {!hasAccommodation && booking.variant?.name ? (
                <Row label="Option" value={booking.variant.name} />
              ) : null}
            </div>
          </DetailBlock>

          <DetailBlock title="Guest">
            <div className="divide-y divide-gray-100">
              <Row label="Name" value={booking.guest_name || '—'} />
              <Row
                label="Email"
                value={
                  booking.guest_email ? (
                    <a
                      className="text-[#003580] underline-offset-2 hover:underline"
                      href={`mailto:${booking.guest_email}`}
                    >
                      {booking.guest_email}
                    </a>
                  ) : (
                    '—'
                  )
                }
              />
              <Row
                label="Phone"
                value={
                  booking.guest_phone ? (
                    <a
                      className="text-[#003580] underline-offset-2 hover:underline"
                      href={`tel:${booking.guest_phone}`}
                    >
                      {booking.guest_phone}
                    </a>
                  ) : (
                    '—'
                  )
                }
              />
            </div>
          </DetailBlock>

          {booking.notes ? (
            <DetailBlock title="Guest notes">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{booking.notes}</p>
            </DetailBlock>
          ) : null}

          <DetailBlock title="Payment">
            <div className="divide-y divide-gray-100">
              <Row
                label="Total (guest)"
                value={<span className="tabular-nums font-semibold">{totalFmt}</span>}
              />
              <Row label="Platform fee" value={<span className="tabular-nums text-gray-600">{feeFmt}</span>} />
              <Row
                label="Estimated payout to you"
                value={<span className="tabular-nums font-semibold text-emerald-800">{payoutFmt}</span>}
              />
              {booking.stripe_payment_intent_id ? (
                <Row
                  label="Payment reference"
                  value={
                    <span className="break-all font-mono text-xs font-normal text-gray-500">
                      {booking.stripe_payment_intent_id}
                    </span>
                  }
                />
              ) : null}
            </div>
          </DetailBlock>

          {policyName ? (
            <DetailBlock title="Cancellation policy (at booking)">
              <p className="text-sm text-gray-700">{policyName}</p>
            </DetailBlock>
          ) : null}

          <DetailBlock title="Timeline">
            <div className="divide-y divide-gray-100">
              <Row label="Booking created" value={formatDateTime(booking.created_at)} />
              <Row label="Request submitted" value={formatDateTime(booking.request_submitted_at)} />
              <Row label="Gym responded" value={formatDateTime(booking.gym_responded_at)} />
              <Row label="Gym confirmed" value={formatDateTime(booking.gym_confirmed_at)} />
              <Row label="Payment captured" value={formatDateTime(booking.payment_captured_at)} />
              <Row label="Last updated" value={formatDateTime(booking.updated_at)} />
            </div>
          </DetailBlock>
        </div>

        <div className="sticky bottom-0 flex flex-col gap-2 border-t border-gray-100 bg-gray-50/95 px-6 py-4 backdrop-blur-sm sm:flex-row sm:flex-wrap sm:justify-end">
          {booking.guest_email ? (
            <Button variant="outline" className="w-full sm:w-auto" asChild>
              <a href={`mailto:${booking.guest_email}`}>Email guest</a>
            </Button>
          ) : null}
          {canonical === 'pending' ? (
            <>
              <Button
                className="w-full bg-[#003580] text-white hover:bg-[#002a66] sm:w-auto"
                disabled={loading}
                onClick={() => onAccept(booking.id)}
              >
                Accept
              </Button>
              <Button
                variant="destructive"
                className="w-full sm:w-auto"
                disabled={loading}
                onClick={() => onDeclineRequest(booking.id)}
              >
                Decline
              </Button>
            </>
          ) : null}
          {canonical === 'confirmed' ? (
            <>
              <Button
                className="w-full bg-[#003580] text-white hover:bg-[#002a66] sm:w-auto"
                disabled={loading}
                onClick={() => onCapture(booking.id)}
              >
                Capture payment
              </Button>
              <Button
                variant="destructive"
                className="w-full sm:w-auto"
                disabled={loading}
                onClick={() => onCancelBooking(booking.id)}
              >
                Cancel booking
              </Button>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
