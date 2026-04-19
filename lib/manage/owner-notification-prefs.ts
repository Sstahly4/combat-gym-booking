import { z } from 'zod'

export const ownerNotificationPrefsSchema = z.object({
  email_bookings: z.boolean(),
  email_cancellations: z.boolean(),
  email_payouts: z.boolean(),
  email_security: z.boolean(),
  email_marketing: z.boolean(),
})

export type OwnerNotificationPrefs = z.infer<typeof ownerNotificationPrefsSchema>

export const DEFAULT_OWNER_NOTIFICATION_PREFS: OwnerNotificationPrefs = {
  email_bookings: true,
  email_cancellations: true,
  email_payouts: true,
  email_security: true,
  email_marketing: false,
}

export function normalizeOwnerNotificationPrefs(raw: unknown): OwnerNotificationPrefs {
  const base = { ...DEFAULT_OWNER_NOTIFICATION_PREFS }
  if (typeof raw !== 'object' || raw === null) return base
  const o = raw as Record<string, unknown>
  const bool = (key: keyof OwnerNotificationPrefs) =>
    typeof o[key] === 'boolean' ? (o[key] as boolean) : base[key]
  return {
    email_bookings: bool('email_bookings'),
    email_cancellations: bool('email_cancellations'),
    email_payouts: bool('email_payouts'),
    email_security: bool('email_security'),
    email_marketing: bool('email_marketing'),
  }
}
