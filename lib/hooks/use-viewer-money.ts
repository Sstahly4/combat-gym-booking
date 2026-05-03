'use client'

import { useCallback } from 'react'
import { useCurrency } from '@/lib/contexts/currency-context'

/**
 * Format amounts stored in a gym/booking currency using the visitor's selected
 * currency (navbar picker + regional default), matching public-site behaviour.
 */
export function useViewerMoneyFormatter() {
  const { selectedCurrency, convertPrice, formatPrice } = useCurrency()

  const formatPrimary = useCallback(
    (amount: number | null | undefined, storedCurrency: string | null | undefined) => {
      const a = Number(amount) || 0
      const from = (storedCurrency || 'USD').toUpperCase()
      return formatPrice(convertPrice(a, from), selectedCurrency)
    },
    [convertPrice, formatPrice, selectedCurrency]
  )

  /** When the stored currency differs from the viewer's pick, show the original for ops. */
  const recordedNote = useCallback(
    (amount: number | null | undefined, storedCurrency: string | null | undefined) => {
      const a = Number(amount) || 0
      const from = (storedCurrency || 'USD').toUpperCase()
      if (from === selectedCurrency) return null
      return `Recorded ${formatPrice(a, from)}`
    },
    [formatPrice, selectedCurrency]
  )

  return { formatPrimary, recordedNote, selectedCurrency }
}
