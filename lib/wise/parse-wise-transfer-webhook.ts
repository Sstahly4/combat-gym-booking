/**
 * Parse Wise Platform `transfers#state-change` (schema v2) payloads defensively.
 * @see https://api-docs.wise.com/api-docs/webhooks-notifications/event-types
 */
export type WiseTransferStateChange = {
  event_type: string
  transfer_id: string | number
  current_state: string
}

export function parseWiseTransferStateChangePayload(raw: unknown): WiseTransferStateChange | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const eventType = typeof o.event_type === 'string' ? o.event_type : ''
  if (!eventType.includes('transfers#state-change')) return null

  const data = o.data
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>

  const resource = d.resource
  let transferId: string | number | null = null
  if (resource && typeof resource === 'object') {
    const r = resource as Record<string, unknown>
    if (r.type === 'transfer' && (typeof r.id === 'number' || typeof r.id === 'string')) {
      transferId = r.id as string | number
    }
  }

  const current =
    typeof d.current_state === 'string'
      ? d.current_state
      : d.current_state && typeof d.current_state === 'object'
        ? String((d.current_state as Record<string, unknown>).status ?? '')
        : ''

  if (transferId == null || !current) return null

  return {
    event_type: eventType,
    transfer_id: transferId,
    current_state: current,
  }
}
