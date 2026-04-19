/**
 * Owner-portal feature flags.
 *
 * Flag resolution order (first hit wins):
 *   1. Process env override:           NEXT_PUBLIC_FLAG_<KEY> = "true" | "false"
 *   2. Server-side env override:       FLAG_<KEY>            = "true" | "false"
 *   3. Hard-coded default below.
 *
 * Keep this file dependency-free. Flags are read at request time so the
 * shape works in both client and server components (env values that are not
 * NEXT_PUBLIC_* are simply unavailable on the client and fall through).
 *
 * To add a flag:
 *   - Add a key to `OwnerPortalFlag`
 *   - Add a default in `DEFAULTS`
 *   - Optionally document in `docs/readiness-contract.md` if it gates readiness.
 */

export type OwnerPortalFlag =
  | 'security_gate_enforced'
  | 'wizard_persisted_state'
  | 'dashboard_today_chart'
  | 'dashboard_overview_metrics'
  | 'mfa_recovery_codes'
  | 'new_device_alerts'
  | 'payout_change_hold'
  | 'telemetry_enabled'
  | 'trusted_devices'

const DEFAULTS: Record<OwnerPortalFlag, boolean> = {
  security_gate_enforced: true,
  wizard_persisted_state: true,
  dashboard_today_chart: true,
  dashboard_overview_metrics: true,
  mfa_recovery_codes: true,
  new_device_alerts: true,
  payout_change_hold: true,
  telemetry_enabled: true,
  trusted_devices: false,
}

function readEnvBool(key: string): boolean | null {
  if (typeof process === 'undefined') return null
  const v = process.env?.[key]
  if (v === undefined) return null
  const lowered = String(v).trim().toLowerCase()
  if (lowered === 'true' || lowered === '1' || lowered === 'on') return true
  if (lowered === 'false' || lowered === '0' || lowered === 'off') return false
  return null
}

export function isFeatureEnabled(flag: OwnerPortalFlag): boolean {
  const upper = flag.toUpperCase()
  const pub = readEnvBool(`NEXT_PUBLIC_FLAG_${upper}`)
  if (pub !== null) return pub
  const srv = readEnvBool(`FLAG_${upper}`)
  if (srv !== null) return srv
  return DEFAULTS[flag]
}

/** Bulk read for client serialisation (e.g. server -> client component prop). */
export function readAllOwnerPortalFlags(): Record<OwnerPortalFlag, boolean> {
  const out = {} as Record<OwnerPortalFlag, boolean>
  for (const key of Object.keys(DEFAULTS) as OwnerPortalFlag[]) {
    out[key] = isFeatureEnabled(key)
  }
  return out
}
