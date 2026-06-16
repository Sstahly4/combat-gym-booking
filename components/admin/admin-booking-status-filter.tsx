'use client'

import {
  ADMIN_BOOKING_FILTER_OPTIONS,
  type AdminBookingListFilter,
} from '@/lib/bookings/admin-booking-filters'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export function AdminBookingStatusFilter({
  value,
  onChange,
  className,
  id = 'admin-booking-status-filter',
}: {
  value: AdminBookingListFilter
  onChange: (value: AdminBookingListFilter) => void
  className?: string
  id?: string
}) {
  const selected = ADMIN_BOOKING_FILTER_OPTIONS.find((o) => o.value === value)

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={id} className="text-[11px] font-medium text-stone-500">
        Status
      </label>
      <Select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as AdminBookingListFilter)}
        className="h-9 min-w-[11rem] rounded-lg border-stone-200 bg-white text-sm"
      >
        {ADMIN_BOOKING_FILTER_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
      {selected ? (
        <p className="text-[11px] text-stone-500">{selected.hint}</p>
      ) : null}
    </div>
  )
}
