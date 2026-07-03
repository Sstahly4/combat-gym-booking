'use client'

import { useEffect, useMemo, useState } from 'react'
import { Copy, MoreHorizontal, RefreshCw, Download } from 'lucide-react'
import { formatDistanceToNowStrict } from 'date-fns'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CalendarImportDialog } from '@/components/manage/calendar-import-dialog'

type FeedStatus =
  | { state: 'loading' }
  | { state: 'none' }
  | { state: 'active'; lastAccessedAt: string | null }

function relativeLastAccessed(iso: string | null): string {
  if (!iso) return 'Never synced'
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return 'Never synced'
    return formatDistanceToNowStrict(d, { addSuffix: true })
  } catch {
    return 'Never synced'
  }
}

export function CalendarSyncToolbar({
  gymId,
  packageVariantId,
  className,
  onImportChanged,
}: {
  gymId: string
  packageVariantId?: string | null
  className?: string
  onImportChanged?: () => void
}) {
  const [status, setStatus] = useState<FeedStatus>({ state: 'loading' })
  const [working, setWorking] = useState(false)
  const [url, setUrl] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
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
        if (!res.ok || !json?.exists) {
          setStatus({ state: 'none' })
          return
        }
        setStatus({ state: 'active', lastAccessedAt: json?.last_accessed_at ?? null })
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
        setToast(json?.error || 'Could not generate feed link')
        return
      }
      setUrl(String(json.url))
      setStatus({ state: 'active', lastAccessedAt: null })
      setToast(regenerate ? 'New sync link created' : 'Sync link ready')
    } finally {
      setWorking(false)
    }
  }

  async function copyLink() {
    if (status.state === 'none') {
      await generate(false)
      return
    }
    if (!url) {
      setToast('Generate a link first')
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setToast('Copied')
    } catch {
      setToast('Copy failed')
    }
  }

  const syncHint =
    status.state === 'active' && status.lastAccessedAt
      ? `Synced ${relativeLastAccessed(status.lastAccessedAt)}`
      : status.state === 'active'
        ? 'Link active'
        : null

  return (
    <div className={cn('relative flex items-center gap-2', className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 border-gray-200 text-gray-700"
        onClick={() => setImportOpen(true)}
      >
        <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden />
        Import calendar
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={working}
        className="h-9 border-gray-200 text-gray-700"
        onClick={() => void copyLink()}
      >
        <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden />
        {status.state === 'none' ? 'Export calendar' : 'Copy sync link'}
      </Button>

      {status.state === 'active' ? (
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 w-9 border-gray-200 p-0 text-gray-600"
            aria-label="Calendar sync options"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          {menuOpen ? (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 cursor-default"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  disabled={working}
                  onClick={async () => {
                    setMenuOpen(false)
                    const ok = window.confirm(
                      'Regenerating breaks existing Airbnb / Google Calendar syncs. Continue?'
                    )
                    if (!ok) return
                    await generate(true)
                  }}
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                  Regenerate link
                </button>
                {syncHint ? (
                  <p className="border-t border-gray-100 px-3 py-2 text-[11px] text-gray-500">
                    {syncHint}. External calendars may refresh every few hours.
                  </p>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {toast ? (
        <span className="text-xs font-medium text-gray-500" role="status" aria-live="polite">
          {toast}
        </span>
      ) : null}

      <CalendarImportDialog
        gymId={gymId}
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onChanged={() => onImportChanged?.()}
      />
    </div>
  )
}
