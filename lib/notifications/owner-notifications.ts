/**
 * Owner-facing notifications.
 *
 * Single entry point for "tell the gym owner something happened":
 *   - Always inserts a row into owner_notifications (the navbar bell).
 *   - Optionally fires an email through lib/email.ts, gated by the owner's
 *     existing notification preferences in profiles.owner_notification_prefs.
 *
 * Best-effort by design — failures are logged, never thrown back to the
 * caller. The booking / review / payout pipeline must not break because we
 * couldn't deliver a notification.
 */
import type { OwnerNotificationType } from '@/lib/types/database'
import {
  normalizeOwnerNotificationPrefs,
  type OwnerNotificationPrefs,
} from '@/lib/manage/owner-notification-prefs'

/** Loose Supabase client shape so this module stays auth-agnostic. */
type AnySupabase = {
  from: (table: string) => any
}

interface RecordOwnerNotificationInput {
  user_id: string
  gym_id?: string | null
  type: OwnerNotificationType
  title: string
  body?: string | null
  link_href?: string | null
  metadata?: Record<string, unknown>
  /**
   * Optional email side-effect. We only send if the owner's notification
   * pref for the matching channel is enabled (and the email payload is
   * provided). If `email` is omitted we just write the in-app row.
   */
  email?: {
    /** Which preference key gates this email. */
    pref_key: keyof OwnerNotificationPrefs
    /** Synchronous send function returning true on success. */
    send: () => Promise<boolean>
  }
}

let loggedMissingTable = false

function isMissingTableError(error: unknown): boolean {
  const e = error as { code?: string; message?: string }
  if (e?.code === 'PGRST205') return true
  const msg = typeof e?.message === 'string' ? e.message : ''
  return /Could not find the table/i.test(msg) && /owner_notifications/i.test(msg)
}

export async function recordOwnerNotification(
  supabase: AnySupabase,
  input: RecordOwnerNotificationInput,
): Promise<void> {
  try {
    const row = {
      user_id: input.user_id,
      gym_id: input.gym_id ?? null,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      link_href: input.link_href ?? null,
      metadata: input.metadata ?? {},
    }
    const { error } = await supabase.from('owner_notifications').insert(row)
    if (error) {
      if (isMissingTableError(error)) {
        if (!loggedMissingTable) {
          loggedMissingTable = true
          console.info(
            '[owner-notifications] Table owner_notifications is not in this database yet. Apply migration 046 (supabase db push / SQL editor), then reload. Inserts are skipped until then.',
          )
        }
      } else {
        console.warn('[owner-notifications] insert failed', input.type, error)
      }
    }
  } catch (err) {
    console.warn('[owner-notifications] threw', input.type, err)
  }

  if (!input.email) return

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('owner_notification_prefs')
      .eq('id', input.user_id)
      .maybeSingle()
    const prefs = normalizeOwnerNotificationPrefs(profile?.owner_notification_prefs ?? null)
    if (!prefs[input.email.pref_key]) return
    await input.email.send()
  } catch (err) {
    console.warn('[owner-notifications] email threw', input.type, err)
  }
}
