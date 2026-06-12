import type { GymCancellationPolicyTone } from '@/lib/booking/cancellation-policy'

export type PackageCancellationPresetId =
  | 'flexible'
  | 'moderate'
  | 'strict'
  | 'non_refundable'
  | 'custom'

export type PackageCancellationPreset = {
  id: Exclude<PackageCancellationPresetId, 'custom'>
  label: string
  tone: GymCancellationPolicyTone
  /** Days before check-in for a full refund; null = non-refundable */
  days: number | null
  description: string
  guestSummary: string
}

/** Industry-standard tiers aligned with OTA flexible / moderate / strict naming. */
export const PACKAGE_CANCELLATION_PRESETS: PackageCancellationPreset[] = [
  {
    id: 'flexible',
    label: 'Flexible',
    tone: 'flexible',
    days: 5,
    description: 'Full refund if the guest cancels at least 5 days before check-in.',
    guestSummary: 'Free cancellation up to 5 days before check-in',
  },
  {
    id: 'moderate',
    label: 'Moderate',
    tone: 'moderate',
    days: 7,
    description: 'Full refund if the guest cancels at least 7 days before check-in.',
    guestSummary: 'Free cancellation up to 7 days before check-in',
  },
  {
    id: 'strict',
    label: 'Strict',
    tone: 'strict',
    days: 14,
    description: 'Full refund only if the guest cancels at least 14 days before check-in.',
    guestSummary: 'Free cancellation up to 14 days before check-in',
  },
  {
    id: 'non_refundable',
    label: 'Non-refundable',
    tone: 'strict',
    days: null,
    description: 'No free cancellation window. Shown as non-refundable at checkout.',
    guestSummary: 'Non-refundable',
  },
]

export function inferCancellationPresetFromDays(
  days: number | null | undefined
): { presetId: PackageCancellationPresetId; customDays: string } {
  if (days == null) {
    return { presetId: 'non_refundable', customDays: '' }
  }
  const match = PACKAGE_CANCELLATION_PRESETS.find((p) => p.days === days)
  if (match) {
    return { presetId: match.id, customDays: '' }
  }
  return { presetId: 'custom', customDays: String(days) }
}

export function resolvePackageCancellationDays(
  presetId: PackageCancellationPresetId,
  customDays: string
): number | null {
  if (presetId === 'non_refundable') return null
  if (presetId === 'custom') {
    const parsed = parseInt(customDays.trim(), 10)
    if (!Number.isFinite(parsed) || parsed < 1) return null
    return parsed
  }
  const preset = PACKAGE_CANCELLATION_PRESETS.find((p) => p.id === presetId)
  return preset?.days ?? null
}

export function getOwnerCancellationPreviewLine(
  presetId: PackageCancellationPresetId,
  customDays: string
): string {
  const days = resolvePackageCancellationDays(presetId, customDays)
  if (days == null) {
    if (presetId === 'custom' && customDays.trim()) {
      return 'Enter a valid number of days (1 or more), or choose non-refundable.'
    }
    return 'Guests will see: Non-refundable — no free cancellation window'
  }
  if (days === 1) {
    return 'Guests will see: Free cancellation up to 1 day before check-in'
  }
  return `Guests will see: Free cancellation up to ${days} days before check-in`
}

export function packageShowsFreeCancellation(days: number | null | undefined): boolean {
  return days != null && days > 0
}

export function isCancellationPolicySelectionValid(
  presetId: PackageCancellationPresetId,
  customDays: string
): boolean {
  if (presetId === 'custom') {
    const parsed = parseInt(customDays.trim(), 10)
    return Number.isFinite(parsed) && parsed >= 1
  }
  return true
}
