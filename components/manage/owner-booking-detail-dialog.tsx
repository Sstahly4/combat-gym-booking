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

export type OwnerBookingRow = Booking & {
  gym: Gym
  package: { id: string; name: string | null; sport?: string | null; offer_type?: string | null } | null
  variant: { id: string; name: string | null } | null
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
    <div className="space-y-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{title}</h3>
      <div className="text-sm text-gray-800">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <span className="shrink-0 text-xs font-normal text-gray-500">{label}</span>
      <span className="min-w-0 text-right text-sm font-light text-gray-900">{value}</span>
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange} stackClassName="z-[120]">
      <DialogContent className="max-h-[min(90vh,720px)] max-w-2xl overflow-y-auto border border-gray-200/90 bg-white p-0 shadow-xl">
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
          </DialogHeader>
        </div>

        <div className="space-y-8 px-6 py-6">
          <DetailBlock title="Stay">
            <div className="space-y-2">
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

          <DetailBlock title="Guest">
            <div className="space-y-2">
              <Row label="Name" value={booking.guest_name || '—'} />
              <Row
                label="Email"
                value={
                  booking.guest_email ? (
                    <a className="text-[#003580] underline-offset-2 hover:underline" href={`mailto:${booking.guest_email}`}>
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
                    <a className="text-[#003580] underline-offset-2 hover:underline" href={`tel:${booking.guest_phone}`}>
                      {booking.guest_phone}
                    </a>
                  ) : (
                    '—'
                  )
                }
              />
            </div>
          </DetailBlock>

          <DetailBlock title="Training & package">
            <div className="space-y-2">
              <Row label="Discipline" value={booking.discipline || '—'} />
              <Row label="Experience" value={experienceLabel(booking.experience_level)} />
              <Row label="Package" value={booking.package?.name || '—'} />
              {booking.variant?.name ? <Row label="Option / tier" value={booking.variant.name} /> : null}
              {booking.package?.sport ? <Row label="Sport" value={booking.package.sport} /> : null}
            </div>
          </DetailBlock>

          {booking.notes ? (
            <DetailBlock title="Guest notes">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{booking.notes}</p>
            </DetailBlock>
          ) : null}

          <DetailBlock title="Payment">
            <div className="space-y-2">
              <Row label="Total (guest)" value={<span className="tabular-nums font-medium">{totalFmt}</span>} />
              <Row label="Platform fee" value={<span className="tabular-nums text-gray-600">{feeFmt}</span>} />
              <Row
                label="Estimated payout to you"
                value={<span className="tabular-nums font-medium text-emerald-800">{payoutFmt}</span>}
              />
              {booking.stripe_payment_intent_id ? (
                <Row
                  label="Payment reference"
                  value={
                    <span className="break-all font-mono text-xs text-gray-500">
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
            <div className="space-y-2">
              <Row label="Booking created" value={formatDateTime(booking.created_at)} />
              <Row label="Request submitted" value={formatDateTime(booking.request_submitted_at)} />
              <Row label="Gym confirmed" value={formatDateTime(booking.gym_confirmed_at)} />
              <Row label="Payment captured" value={formatDateTime(booking.payment_captured_at)} />
              <Row label="Last updated" value={formatDateTime(booking.updated_at)} />
            </div>
          </DetailBlock>
        </div>

        <div className="flex flex-col gap-2 border-t border-gray-100 bg-gray-50/80 px-6 py-4 sm:flex-row sm:flex-wrap sm:justify-end">
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
