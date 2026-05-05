'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { MessageCircleReply, Star, RefreshCw, Info } from 'lucide-react'

type OwnerReview = {
  id: string
  booking_id: string | null
  gym_id: string | null
  gym_name: string
  reviewer_name: string | null
  rating: number
  comment: string | null
  owner_reply: string | null
  owner_replied_at: string | null
  created_at: string
}

type ReplyFilter = 'all' | 'needs_reply' | 'replied'
type SortMode = 'newest' | 'oldest' | 'rating_high' | 'rating_low'

function Stars({ rating }: { rating: number }) {
  const r = Math.min(5, Math.max(0, Math.round(rating)))
  return (
    <div className="flex items-center gap-0.5" aria-label={`${r} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            'h-3.5 w-3.5 shrink-0',
            i <= r ? 'fill-amber-400 text-amber-400' : 'fill-gray-100 text-gray-200'
          )}
          strokeWidth={1.5}
          aria-hidden
        />
      ))}
      <span className="ml-1 text-xs font-medium tabular-nums text-gray-700">{r}.0</span>
    </div>
  )
}

function ReviewRow({
  review,
  draft,
  onDraftChange,
  onSave,
  saving,
}: {
  review: OwnerReview
  draft: string
  onDraftChange: (value: string) => void
  onSave: () => void
  saving: boolean
}) {
  const hasReply = Boolean(review.owner_reply?.trim())
  const needsAttention = !hasReply
  const [open, setOpen] = useState(needsAttention)

  return (
    <article className="group py-5 transition-colors hover:bg-gray-50/60">
      <div className="flex items-start gap-3 px-1">
        <span
          className={cn(
            'mt-1.5 hidden w-0.5 shrink-0 self-stretch rounded-full sm:block',
            needsAttention ? 'bg-amber-400' : 'bg-[#003580]/60'
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-sm font-semibold text-gray-900">{review.gym_name}</span>
            <Stars rating={review.rating} />
            {needsAttention ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 ring-1 ring-inset ring-amber-200/70">
                Needs reply
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#003580]/10 px-2 py-0.5 text-[10px] font-medium text-[#003580] ring-1 ring-inset ring-[#003580]/20">
                Replied
              </span>
            )}
            <span className="text-[11px] font-light tabular-nums text-gray-400">
              {review.reviewer_name?.trim() || 'Guest'} ·{' '}
              {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
            </span>
          </div>

          {review.comment ? (
            <p className="text-sm leading-relaxed text-gray-700">{review.comment}</p>
          ) : (
            <p className="text-sm italic text-gray-500">No written comment — rating only.</p>
          )}

          {hasReply ? (
            <div className="rounded-md bg-gray-50/80 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Your reply</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{review.owner_reply}</p>
              {review.owner_replied_at ? (
                <p className="mt-1 text-[10px] font-light text-gray-400">
                  Posted {formatDistanceToNow(new Date(review.owner_replied_at), { addSuffix: true })}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="font-medium text-[#003580] underline-offset-2 hover:underline"
            >
              {open ? 'Hide reply box' : hasReply ? 'Update reply' : 'Reply'}
            </button>
            {review.booking_id ? (
              <span className="text-[11px] font-light text-gray-400">
                Booking <span className="font-mono text-gray-500">{review.booking_id.slice(0, 8)}…</span>
              </span>
            ) : null}
          </div>

          {open ? (
            <div className="mt-2 space-y-2">
              <Textarea
                id={`reply-${review.id}`}
                rows={4}
                maxLength={1000}
                value={draft}
                onChange={(e) => onDraftChange(e.target.value)}
                placeholder="Thank the guest, address feedback professionally, and invite them back…"
                className="resize-y border-gray-200 text-sm shadow-none"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-400">
                <span>{draft.length}/1000</span>
                <Button
                  size="sm"
                  className="h-8 bg-[#003580] px-3 text-xs font-medium text-white hover:bg-[#002a66]"
                  onClick={() => void onSave()}
                  disabled={saving || !draft.trim()}
                >
                  {saving ? 'Saving…' : hasReply ? 'Update reply' : 'Post reply'}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export default function OwnerReviewsPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reviews, setReviews] = useState<OwnerReview[]>([])
  const [draftReplies, setDraftReplies] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null)

  const [search, setSearch] = useState('')
  const [gymFilter, setGymFilter] = useState<string>('all')
  const [ratingFilter, setRatingFilter] = useState<string>('all')
  const [replyFilter, setReplyFilter] = useState<ReplyFilter>('all')
  const [sortMode, setSortMode] = useState<SortMode>('newest')

  const loadReviews = useCallback(async () => {
    setError(null)
    try {
      const response = await fetch('/api/manage/reviews', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to load reviews')
        return
      }
      const rows = (data.reviews || []) as OwnerReview[]
      setReviews(rows)
      setDraftReplies((prev) => {
        const next = { ...prev }
        for (const review of rows) {
          if (next[review.id] === undefined) {
            next[review.id] = review.owner_reply || ''
          }
        }
        return next
      })
      setFetchedAt(new Date())
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/auth/signin')
      return
    }
    if (!profile || profile.role !== 'owner') {
      router.replace('/')
      return
    }
    setLoading(true)
    void loadReviews()
  }, [authLoading, user, profile, router, loadReviews])

  useEffect(() => {
    if (authLoading || !user || profile?.role !== 'owner') return
    const tick = () => void loadReviews()
    const id = setInterval(tick, 30_000)
    const onVis = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [authLoading, user, profile?.role, loadReviews])

  const gymOptions = useMemo(() => {
    const m = new Map<string, string>()
    for (const r of reviews) {
      if (r.gym_id) m.set(r.gym_id, r.gym_name)
    }
    return Array.from(m.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [reviews])

  const stats = useMemo(() => {
    if (reviews.length === 0) return { avg: 0, total: 0, needsReply: 0, replied: 0 }
    const sum = reviews.reduce((s, r) => s + r.rating, 0)
    const needsReply = reviews.filter((r) => !(r.owner_reply || '').trim()).length
    return {
      avg: sum / reviews.length,
      total: reviews.length,
      needsReply,
      replied: reviews.length - needsReply,
    }
  }, [reviews])

  const filtered = useMemo(() => {
    let list = [...reviews]
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter((r) => {
        const blob = `${r.reviewer_name || ''} ${r.comment || ''} ${r.gym_name}`.toLowerCase()
        return blob.includes(q)
      })
    }
    if (gymFilter !== 'all') {
      list = list.filter((r) => r.gym_id === gymFilter)
    }
    if (ratingFilter !== 'all') {
      const n = Number(ratingFilter)
      list = list.filter((r) => Math.round(r.rating) === n)
    }
    if (replyFilter === 'needs_reply') {
      list = list.filter((r) => !(r.owner_reply || '').trim())
    }
    if (replyFilter === 'replied') {
      list = list.filter((r) => Boolean((r.owner_reply || '').trim()))
    }
    list.sort((a, b) => {
      switch (sortMode) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'rating_high':
          return b.rating - a.rating
        case 'rating_low':
          return a.rating - b.rating
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })
    return list
  }, [reviews, search, gymFilter, ratingFilter, replyFilter, sortMode])

  const tabs: Array<{ id: ReplyFilter; label: string; count: number }> = [
    { id: 'all', label: 'All', count: stats.total },
    { id: 'needs_reply', label: 'Needs reply', count: stats.needsReply },
    { id: 'replied', label: 'Replied', count: stats.replied },
  ]

  const saveReply = async (reviewId: string) => {
    const reply = (draftReplies[reviewId] || '').trim()
    if (!reply) return
    setSavingId(reviewId)
    setError(null)
    try {
      const response = await fetch(`/api/manage/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to save reply')
        return
      }
      await loadReviews()
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save reply')
    } finally {
      setSavingId(null)
    }
  }

  const exportCsv = () => {
    const headers = ['gym', 'reviewer', 'rating', 'comment', 'owner_reply', 'review_date', 'replied_at']
    const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const lines = filtered.map((r) =>
      [
        r.gym_name,
        r.reviewer_name || '',
        r.rating,
        r.comment || '',
        r.owner_reply || '',
        r.created_at,
        r.owner_replied_at || '',
      ]
        .map(escape)
        .join(',')
    )
    const blob = new Blob([[headers.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reviews-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (authLoading || (loading && reviews.length === 0)) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-3 sm:px-6 sm:py-8">
          <div className="space-y-2">
            <div className="h-8 w-48 animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-full max-w-md animate-pulse rounded bg-gray-100/80" />
          </div>
          <div className="h-px w-full bg-gray-100" />
          <div className="space-y-0 divide-y divide-gray-100 border-t border-gray-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2 py-5">
                <div className="h-4 w-40 animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-full max-w-lg animate-pulse rounded bg-gray-100/80" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-3 sm:px-6 sm:py-8">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
                Reviews{' '}
                <span className="font-light tabular-nums text-gray-900">{stats.total}</span>
              </h1>
              {stats.total > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-inset ring-amber-200/70">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
                  {stats.avg.toFixed(1)} avg
                </span>
              ) : null}
              {stats.needsReply > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#003580]/10 px-2 py-0.5 text-[11px] font-medium text-[#003580] ring-1 ring-inset ring-[#003580]/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#003580]" aria-hidden />
                  {stats.needsReply} need reply
                </span>
              ) : null}
              <span
                className="group relative inline-flex"
                tabIndex={0}
                role="button"
                aria-label="About reviews"
              >
                <Info className="h-3.5 w-3.5 text-gray-400" strokeWidth={1.75} aria-hidden />
                <span
                  role="tooltip"
                  className="pointer-events-none invisible absolute left-1/2 top-[calc(100%+8px)] z-30 w-[min(20rem,calc(100vw-2.5rem))] -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-[11px] font-normal leading-snug text-gray-700 shadow-md opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
                >
                  Replies are public and refresh across the site automatically. Aim to respond to every review
                  within 48 hours.
                </span>
              </span>
            </div>
            <p className="max-w-2xl text-sm font-normal text-gray-500">
              Read guest feedback, respond publicly, and keep your reputation strong. The list refreshes every 30
              seconds.
            </p>
            {fetchedAt ? (
              <p className="text-[11px] font-light text-gray-400">
                Updated {formatDistanceToNow(fetchedAt, { addSuffix: true })}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              className="h-8 bg-[#003580] px-3 text-xs font-medium text-white hover:bg-[#002a66]"
              onClick={exportCsv}
              disabled={filtered.length === 0}
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-gray-200 text-xs text-gray-700 hover:bg-gray-50"
              onClick={() => void loadReviews()}
            >
              <RefreshCw className="mr-1 h-3 w-3" aria-hidden />
              Refresh
            </Button>
          </div>
        </header>

        <div className="space-y-5 border-b border-gray-100 pb-8">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Refine list</h2>
            <p className="mt-1 text-xs font-normal text-gray-500">
              Filters apply instantly. Switch group tabs below to focus on what needs attention.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6 lg:gap-x-4 lg:gap-y-4">
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label htmlFor="reviews-search" className="text-xs font-medium text-gray-600">
                Search
              </Label>
              <Input
                id="reviews-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Guest name, comment, gym…"
                className="h-9 border-gray-200 bg-white text-sm shadow-none"
              />
            </div>
            <div className="space-y-2 lg:col-span-3">
              <Label className="text-xs font-medium text-gray-600">Sort by</Label>
              <Select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="h-9 border-gray-200 bg-white text-sm shadow-none"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="rating_high">Highest rating</option>
                <option value="rating_low">Lowest rating</option>
              </Select>
            </div>
            {gymOptions.length > 1 ? (
              <div className="space-y-2 lg:col-span-2">
                <Label className="text-xs font-medium text-gray-600">Gym</Label>
                <Select
                  value={gymFilter}
                  onChange={(e) => setGymFilter(e.target.value)}
                  className="h-9 border-gray-200 bg-white text-sm shadow-none"
                >
                  <option value="all">All gyms</option>
                  {gymOptions.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}
            <div className="space-y-2 lg:col-span-2">
              <Label className="text-xs font-medium text-gray-600">Star rating</Label>
              <Select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="h-9 border-gray-200 bg-white text-sm shadow-none"
              >
                <option value="all">All ratings</option>
                <option value="5">5 stars</option>
                <option value="4">4 stars</option>
                <option value="3">3 stars</option>
                <option value="2">2 stars</option>
                <option value="1">1 star</option>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span>
              Showing{' '}
              <span className="font-medium text-gray-900 tabular-nums">{filtered.length}</span> of{' '}
              <span className="tabular-nums">{stats.total}</span>
            </span>
            <span aria-hidden className="text-gray-300">
              ·
            </span>
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setGymFilter('all')
                setRatingFilter('all')
                setReplyFilter('all')
                setSortMode('newest')
              }}
              className="text-[#003580] underline-offset-2 hover:underline"
            >
              Reset filters
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}

        {reviews.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/40 px-6 py-14 text-center">
            <MessageCircleReply className="mx-auto h-8 w-8 text-gray-300" strokeWidth={1.25} aria-hidden />
            <p className="mt-3 text-sm font-medium text-gray-700">No reviews yet</p>
            <p className="mt-1 text-xs font-normal text-gray-500">
              When guests leave feedback after their stay, it will show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Guest feedback</h2>
              <p className="mt-1 text-xs font-normal text-gray-500">
                Switch between groups. Counts reflect the current filter selection.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-gray-200">
                {tabs.map((tab) => {
                  const active = replyFilter === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setReplyFilter(tab.id)}
                      className={cn(
                        '-mb-px inline-flex items-center gap-1.5 border-b-2 pb-2 text-sm transition-colors',
                        active
                          ? 'border-[#003580] font-medium text-[#003580]'
                          : 'border-transparent text-gray-500 hover:text-gray-800'
                      )}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums ring-1 ring-inset',
                          active
                            ? 'bg-[#003580]/10 text-[#003580] ring-[#003580]/20'
                            : 'bg-gray-100 text-gray-600 ring-gray-200/80'
                        )}
                      >
                        {tab.count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/40 px-6 py-12 text-center text-sm text-gray-600">
                No reviews match your filters.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filtered.map((review) => (
                  <ReviewRow
                    key={review.id}
                    review={review}
                    draft={draftReplies[review.id] ?? ''}
                    onDraftChange={(v) => setDraftReplies((prev) => ({ ...prev, [review.id]: v }))}
                    onSave={() => void saveReply(review.id)}
                    saving={savingId === review.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
