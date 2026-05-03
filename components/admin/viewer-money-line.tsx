'use client'

import { useViewerMoneyFormatter } from '@/lib/hooks/use-viewer-money'

export function ViewerMoneyLine({
  amount,
  storedCurrency,
  suffix,
  align = 'end',
}: {
  amount: number | null | undefined
  storedCurrency: string | null | undefined
  suffix?: string
  align?: 'start' | 'end'
}) {
  const { formatPrimary, recordedNote } = useViewerMoneyFormatter()
  const note = recordedNote(amount, storedCurrency)
  return (
    <span className={`inline-flex flex-col ${align === 'end' ? 'items-end text-right' : 'items-start'}`}>
      <span>
        {formatPrimary(amount, storedCurrency)}
        {suffix ? ` ${suffix}` : ''}
      </span>
      {note ? <span className="text-[11px] font-normal text-stone-500">{note}</span> : null}
    </span>
  )
}
