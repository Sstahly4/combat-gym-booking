import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Best-effort country hint from edge headers (e.g. Vercel). Local dev usually returns null.
 */
export async function GET() {
  const h = await headers()
  const code =
    (h.get('x-vercel-ip-country') || h.get('cf-ipcountry') || '').trim().toUpperCase() || null
  return NextResponse.json({ country_code: code && code.length === 2 ? code : null })
}
