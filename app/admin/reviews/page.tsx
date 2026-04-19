'use client'

/**
 * Admin manual reviews page.
 *
 * Auth guard is provided by `app/admin/layout.tsx`. This UI exposes the
 * "create a verified review against any approved gym" flow that used to live
 * inline on the legacy admin page (kept after MVP because backfilled reviews
 * persist in the DB).
 */
import { useCallback, useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Gym } from '@/lib/types/database'

interface ManualReviewRow {
  id: string
  gym_id: string
  rating: number
  comment: string | null
  reviewer_name: string | null
  created_at: string
  manual_review: boolean | null
}

export default function AdminReviewsPage() {
  const [allGyms, setAllGyms] = useState<Gym[]>([])
  const [recent, setRecent] = useState<ManualReviewRow[]>([])
  const [form, setForm] = useState({
    gym_id: '',
    rating: '5',
    comment: '',
    reviewer_name: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const [gymsRes, reviewsRes] = await Promise.all([
        supabase
          .from('gyms')
          .select('*')
          .eq('status', 'approved')
          .order('name', { ascending: true }),
        supabase
          .from('reviews')
          .select('id, gym_id, rating, comment, reviewer_name, created_at, manual_review')
          .eq('manual_review', true)
          .order('created_at', { ascending: false })
          .limit(20),
      ])
      setAllGyms((gymsRes.data ?? []) as Gym[])
      setRecent((reviewsRes.data ?? []) as ManualReviewRow[])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const submit = async () => {
    if (!form.gym_id || !form.reviewer_name.trim()) {
      alert('Pick a gym and enter a reviewer name.')
      return
    }
    setSubmitting(true)
    try {
      const supabase = createClient()
      const now = new Date()
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      const randomDate = new Date(
        oneYearAgo.getTime() + Math.random() * (now.getTime() - oneYearAgo.getTime()),
      )
      const { error } = await supabase.from('reviews').insert({
        gym_id: form.gym_id,
        booking_id: null,
        rating: parseInt(form.rating, 10),
        comment: form.comment || null,
        reviewer_name: form.reviewer_name || null,
        manual_review: true,
        created_at: randomDate.toISOString(),
      })
      if (error) {
        alert(`Failed to create review: ${error.message}`)
        return
      }
      setForm({ gym_id: '', rating: '5', comment: '', reviewer_name: '' })
      load()
    } finally {
      setSubmitting(false)
    }
  }

  const gymName = (id: string) => allGyms.find((g) => g.id === id)?.name ?? 'Unknown gym'

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Admin</p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-stone-900">
          <Star className="h-5 w-5 text-fuchsia-600" />
          Manual reviews
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Backfill verified reviews against any approved gym. These show up on
          the gym page and persist in the database.
        </p>
      </header>

      <section className="mb-10 rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-stone-900">Add a review</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Gym *</Label>
            <Select
              value={form.gym_id}
              onChange={(e) => setForm({ ...form, gym_id: e.target.value })}
            >
              <option value="">Select a gym…</option>
              {allGyms.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} — {g.city}, {g.country}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Reviewer name *</Label>
            <Input
              value={form.reviewer_name}
              onChange={(e) => setForm({ ...form, reviewer_name: e.target.value })}
              placeholder="e.g. John Smith"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Rating *</Label>
            <Select
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: e.target.value })}
            >
              <option value="5">5 — Excellent</option>
              <option value="4">4 — Very good</option>
              <option value="3">3 — Good</option>
              <option value="2">2 — Fair</option>
              <option value="1">1 — Poor</option>
            </Select>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label>Comment</Label>
            <Textarea
              rows={4}
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              placeholder="Optional review text…"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end">
          <Button onClick={submit} disabled={submitting} className="rounded-full">
            {submitting ? 'Saving…' : 'Create review'}
          </Button>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-500">
          Recent manual reviews
        </h2>
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-stone-100" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-200 px-4 py-10 text-center text-sm text-stone-500">
            No manual reviews yet.
          </div>
        ) : (
          <ul className="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200 bg-white">
            {recent.map((r) => (
              <li key={r.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-semibold text-stone-900">
                    {gymName(r.gym_id)}
                  </p>
                  <span className="shrink-0 text-xs text-stone-500">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-stone-500">
                  {r.reviewer_name || 'Anonymous'} · {r.rating}/5
                </p>
                {r.comment && (
                  <p className="mt-1 text-sm text-stone-700">{r.comment}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
