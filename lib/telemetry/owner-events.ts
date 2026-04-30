/**
 * Lightweight owner-portal telemetry.
 *
 * Writes one row per event into `owner_telemetry_events` (see migration 043).
 * Always best-effort: failures are logged but never thrown back to the caller.
 *
 * Event types are typed below so we can grep them and so the dashboard can
 * fan-out into a real analytics backend later (e.g. PostHog) without changing
 * call sites.
 */
import { isFeatureEnabled } from '@/lib/flags/feature-flags'

export type OwnerTelemetryEventType =
  | 'wizard_step_started'
  | 'wizard_step_completed'
  | 'wizard_step_abandoned'
  | 'readiness_checked'
  | 'readiness_failed'
  | 'go_live_attempted'
  | 'go_live_succeeded'
  | 'go_live_failed'
  | 'mfa_recovery_codes_generated'
  | 'mfa_recovery_code_consumed'
  | 'new_device_sign_in'
  | 'password_changed_signed_out_others'
  | 'payouts_hold_activated'
  | 'payouts_hold_cleared'
  | 'gym_claim_link_generated'
  | 'gym_claim_link_revoked'
  | 'gym_claim_link_redeemed'
  | 'gym_claim_password_set'
  | 'gym_claim_email_updated'
  | 'claim_dashboard_tour_finished'
  | 'claim_dashboard_tour_skipped'

export interface OwnerTelemetryEvent {
  event_type: OwnerTelemetryEventType
  user_id?: string | null
  gym_id?: string | null
  metadata?: Record<string, unknown>
}

type AnySupabase = {
  from: (table: string) => {
    insert: (rows: unknown) => Promise<{ error: unknown }>
  }
}

type PostgrestErrorShape = { code?: string; message?: string }

let loggedMissingTelemetryTable = false

function isMissingTableError(error: unknown): boolean {
  const e = error as PostgrestErrorShape
  if (e?.code === 'PGRST205') return true
  const msg = typeof e?.message === 'string' ? e.message : ''
  return /Could not find the table/i.test(msg) && /owner_telemetry_events/i.test(msg)
}

/**
 * Insert a single owner-portal telemetry event. Never throws.
 * Pass the supabase client you already have (server or admin), to avoid
 * forcing this module to know about auth.
 */
export async function recordOwnerEvent(
  supabase: AnySupabase,
  event: OwnerTelemetryEvent
): Promise<void> {
  if (!isFeatureEnabled('telemetry_enabled')) return
  try {
    const row = {
      event_type: event.event_type,
      user_id: event.user_id ?? null,
      gym_id: event.gym_id ?? null,
      metadata: event.metadata ?? {},
    }
    const { error } = await supabase.from('owner_telemetry_events').insert(row)
    if (error) {
      if (isMissingTableError(error)) {
        if (!loggedMissingTelemetryTable) {
          loggedMissingTelemetryTable = true
          console.info(
            '[owner-telemetry] Table owner_telemetry_events is not in this database yet. Apply migration 043 (supabase db push / SQL editor), then reload. Inserts are skipped until then.'
          )
        }
        return
      }
      console.warn('[owner-telemetry] insert failed', event.event_type, error)
    }
  } catch (err) {
    console.warn('[owner-telemetry] threw', event.event_type, err)
  }
}
