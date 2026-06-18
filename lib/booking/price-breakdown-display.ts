import type { TrainingTier } from '@/lib/packages/training-access'
import type { PriceBreakdown, PriceLine } from '@/lib/utils'

export function priceLineUnitLabel(line: PriceLine): string {
  if (line.kind === 'day') return line.qty === 1 ? 'day' : 'days'
  if (line.kind === 'month') return line.qty === 1 ? 'month' : 'months'
  if (line.kind === 'week') return line.qty === 1 ? 'week' : 'weeks'
  return line.qty === 1 ? 'night' : 'nights'
}

/** Left side of a receipt row before "× unit price". */
export function formatPriceLineDescription(line: PriceLine): string {
  const qtyPart = `${line.qty} ${priceLineUnitLabel(line)}`
  const label = line.label?.trim()
  if (!label) return qtyPart
  if (label.includes(String(line.qty)) && label.toLowerCase().includes(priceLineUnitLabel(line))) {
    return label
  }
  return `${label}: ${qtyPart}`
}

export function formatPriceLineWithUnitPrice(
  line: PriceLine,
  formatUnitPrice: (amount: number) => string,
): string {
  return `${formatPriceLineDescription(line)} x ${formatUnitPrice(line.unitPrice)}`
}

export function trainingTierLinePrefix(tier: TrainingTier): string {
  return tier === 'once_daily' ? 'Once Daily Training' : 'Twice Daily Training'
}

/** Prefix training-intensity context onto breakdown lines for checkout receipts. */
export function applyTrainingTierToBreakdown(
  breakdown: PriceBreakdown,
  options: { showTrainingTier: boolean; trainingTier: TrainingTier },
): PriceBreakdown {
  if (!options.showTrainingTier) return breakdown
  const prefix = trainingTierLinePrefix(options.trainingTier)
  return {
    ...breakdown,
    lines: breakdown.lines.map((line) => ({
      ...line,
      label: `${prefix}: ${line.qty} ${priceLineUnitLabel(line)}`,
    })),
  }
}
