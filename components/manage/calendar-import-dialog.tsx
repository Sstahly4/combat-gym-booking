'use client'

import { useCallback, useEffect, useState } from 'react'
import { formatDistanceToNowStrict } from 'date-fns'
import { Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type ImportFeed = {
  id: string
  label: string
  feed_url: string
  enabled: boolean
  last_synced_at: string | null
  last_error: string | null
  block_count: number
}

export function CalendarImportDialog({
  gymId,
  open,
  onClose,
  onChanged,
}: {
  gymId: string
  open: boolean
  onClose: () => void
  onChanged: () => void
}) {
  const [feeds, setFeeds] = useState<ImportFeed[]>([])
  const [loading, setLoading] = useState(true)
  const [url, setUrl] = useState('')
  const [label, setLabel] = useState('Airbnb / Google Calendar')
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/manage/calendar-import-feeds?gym_id=${gymId}`, {
        cache: 'no-store',
      })
      const json = await res.json()
      if (res.ok) setFeeds(json.feeds ?? [])
    } finally {
      setLoading(false)
    }
  }, [gymId])

  useEffect(() => {
    if (!open) return
    void load()
  }, [open, load])

  async function addFeed() {
    setError(null)
    const feedUrl = url.trim()
    if (!feedUrl) {
      setError('Paste an iCal URL')
      return
    }
    setWorking(true)
    try {
      const res = await fetch('/api/manage/calendar-import-feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gym_id: gymId,
          feed_url: feedUrl,
          label: label.trim() || 'External calendar',
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json?.error || 'Could not add feed')
        return
      }
      setUrl('')
      await load()
      onChanged()
    } finally {
      setWorking(false)
    }
  }

  async function syncFeed(id: string) {
    setWorking(true)
    try {
      const res = await fetch(`/api/manage/calendar-import-feeds/${id}`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        setError(json?.error || 'Sync failed')
        return
      }
      await load()
      onChanged()
    } finally {
      setWorking(false)
    }
  }

  async function removeFeed(id: string) {
    if (!window.confirm('Remove this import feed and its blocked dates?')) return
    setWorking(true)
    try {
      await fetch(`/api/manage/calendar-import-feeds/${id}`, { method: 'DELETE' })
      await load()
      onChanged()
    } finally {
      setWorking(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[min(520px,calc(100vw-2rem))]">
        <DialogHeader>
          <DialogTitle>Import external calendar</DialogTitle>
          <p className="text-sm text-gray-500">
            Paste an iCal URL from Airbnb, Google Calendar, or Apple Calendar to block dates
            booked elsewhere.
          </p>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs text-gray-600">Label</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-gray-600">iCal URL</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className="mt-1"
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="button" disabled={working} onClick={() => void addFeed()}>
            {working ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Add import feed
          </Button>
        </div>

        <div className="mt-4 border-t border-gray-100 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Active feeds</h3>
          {loading ? (
            <p className="mt-2 text-sm text-gray-500">Loading…</p>
          ) : feeds.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No import feeds yet.</p>
          ) : (
            <ul className="mt-2 divide-y divide-gray-100 rounded-lg border border-gray-200">
              {feeds.map((f) => (
                <li key={f.id} className="flex items-start justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{f.label}</p>
                    <p className="text-xs text-gray-500">
                      {f.block_count} blocked date{f.block_count === 1 ? '' : 's'}
                      {f.last_synced_at
                        ? ` · synced ${formatDistanceToNowStrict(new Date(f.last_synced_at), { addSuffix: true })}`
                        : ''}
                    </p>
                    {f.last_error ? (
                      <p className="mt-0.5 text-xs text-red-600">{f.last_error}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2"
                      disabled={working}
                      onClick={() => void syncFeed(f.id)}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-red-600"
                      disabled={working}
                      onClick={() => void removeFeed(f.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
