import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function requireOutreachSyncAuth(request: NextRequest): NextResponse | null {
  const secret = process.env.OUTREACH_SYNC_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'OUTREACH_SYNC_SECRET is not configured' }, { status: 501 })
  }
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

export const OUTREACH_STATUS_BATCH_LIMIT = 100

export function parseGymIdsParam(raw: string | null): string[] {
  if (!raw?.trim()) return []
  const ids = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return [...new Set(ids)].slice(0, OUTREACH_STATUS_BATCH_LIMIT)
}
