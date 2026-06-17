'use client'

import { useEffect, useMemo, useState } from 'react'
import { Copy, RefreshCw, Link as LinkIcon, CalendarDays } from 'lucide-react'
import { formatDistanceToNowStrict } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type FeedStatus =
  | { state: 'loading' }
  | { state: 'none' }
  | { state: 'active'; lastAccessedAt: string | null }

function relativeLastAccessed(iso: string | null): string {
  if (!iso) return 'Never accessed yet'
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return 'Never accessed yet'
    return `Last synced ${formatDistanceToNowStrict(d, { addSuffix: true })}`
  } catch {
    return 'Never accessed yet'
  }
}

export function CalendarSyncExportCard({
  gymId,
  packageVariantId,
  className,
}: {
  gymId: string
  packageVariantId?: string | null
  className?: string
}) {
  const scopeLabel = packageVariantId ? 'This room/variant' : 'This gym'
  const [status, setStatus] = useState<FeedStatus>({ state: 'loading' })
  const [working, setWorking] = useState(false)
  const [url, setUrl] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const qs = useMemo(() => {
    const p = new URLSearchParams({ gym_id: gymId })
    if (packageVariantId) p.set('package_variant_id', packageVariantId)
    return p.toString()
  }, [gymId, packageVariantId])

  useEffect(() => {
    let cancelled = false
    setStatus({ state: 'loading' })
    ;(async () => {
      try {
        const res = await fetch(`/api/manage/calendar-export-feeds?${qs}`, { cache: 'no-store' })
        const json = await res.json()
        if (cancelled) return
        if (!res.ok) {
          setStatus({ state: 'none' })
          return
        }
        if (json?.exists) {
          setStatus({ state: 'active', lastAccessedAt: json?.last_accessed_at ?? null })
        } else {
          setStatus({ state: 'none' })
        }
      } catch {
        if (!cancelled) setStatus({ state: 'none' })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [qs])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2500)
    return () => window.clearTimeout(t)
  }, [toast])

  async function generate(regenerate: boolean) {
    setWorking(true)
    try {
      const res = await fetch('/api/manage/calendar-export-feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gym_id: gymId,
          package_variant_id: packageVariantId ?? null,
          regenerate,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        const msg = json?.error || 'Could not generate feed link'
        setToast(msg)
        return
      }
      setUrl(String(json.url))
      setStatus({ state: 'active', lastAccessedAt: null })
      setToast('Calendar link created')
    } finally {
      setWorking(false)
    }
  }

  async function copy() {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setToast('Copied link')
    } catch {
      setToast('Copy failed — try selecting and copying manually')
    }
  }

  const metaLine =
    status.state === 'active' ? relativeLastAccessed(status.lastAccessedAt) : `${scopeLabel} export feed`

  return (
    <section
      aria-label="Calendar Sync (Export)"
      className={cn(
        'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.03]',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#003580]/10 ring-1 ring-[#003580]/15">
              <CalendarDays className="h-4 w-4 text-[#003580]" strokeWidth={2} aria-hidden />
            </span>
            <div>
              <h2 className="text-[15px] font-semibold text-gray-900">Calendar Sync (Export)</h2>
              <p className="mt-0.5 text-[13px] leading-snug text-gray-600">
                Sync your CombatStay bookings with Airbnb, Google Calendar, or Apple Calendar.
              </p>
            </div>
          </div>
        </div>
        <p className="text-[11px] font-medium text-gray-400">{metaLine}</p>
      </div>

      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/40 p-4">
        {status.state === 'loading' ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : status.state === 'none' ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">No export link yet</p>
              <p className="mt-1 text-xs text-gray-600">
                Generate a private link you can paste into external calendars.
              </p>
            </div>
            <Button
              type="button"
              disabled={working}
              className="h-9 bg-[#003580] px-4 text-sm font-medium text-white hover:bg-[#002a66]"
              onClick={() => void generate(false)}
            >
              <LinkIcon className="mr-2 h-4 w-4" aria-hidden />
              Generate calendar feed link
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-gray-900">Status: Link active</p>
              <p className="text-xs text-gray-500">
                {status.lastAccessedAt ? relativeLastAccessed(status.lastAccessedAt) : 'Never accessed yet'}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input readOnly value={url ?? 'Link created. Copy it now or regenerate to get a new link.'} />
              <Button
                type="button"
                variant="outline"
                className="h-9 border-gray-200"
                disabled={!url}
                onClick={() => void copy()}
              >
                <Copy className="mr-2 h-4 w-4" aria-hidden />
                Copy link
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-9 border-gray-200"
                disabled={working}
                onClick={async () => {
                  const ok = window.confirm(
                    'Regenerating this link will instantly break any existing syncs you have set up on Airbnb or Google Calendar. Are you sure?'
                  )
                  if (!ok) return
                  await generate(true)
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
                Regenerate feed link
              </Button>
              <p className="self-center text-xs text-gray-500">
                Tip: some calendars refresh every few hours.
              </p>
            </div>
          </div>
        )}
      </div>

      {toast ? (
        <div className="mt-3 text-xs font-medium text-gray-600" role="status" aria-live="polite">
          {toast}
        </div>
      ) : null}
    </section>
  )
}

