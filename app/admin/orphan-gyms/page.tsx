'use client'

/**
 * Admin → Orphan gyms.
 *
 * Lists every gym whose owner is still a synthetic placeholder account, with
 * the latest claim-link state. From here an admin can:
 *   - Generate a fresh claim link (revokes any prior active link)
 *   - Copy the link to clipboard (only shown once after generation)
 *   - Revoke the active link without re-issuing
 *
 * The plaintext URL is never persisted server-side — generate again any time.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface OrphanGym {
  gym_id: string
  gym_name: string
  city: string | null
  country: string | null
  created_at: string
  is_live: boolean
  status: string
  placeholder_owner_id: string
  placeholder_email: string | null
  claim_password_set: boolean
  latest_token: {
    expires_at: string
    claimed_at: string | null
    revoked_at: string | null
    created_at: string
    expired: boolean
    active: boolean
  } | null
}

export default function OrphanGymsPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [gyms, setGyms] = useState<OrphanGym[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [freshLinks, setFreshLinks] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState('')

  useEffect(() => {
    if (!authLoading && profile && profile.role !== 'admin') {
      router.replace('/')
    }
  }, [authLoading, profile, router])

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/admin/orphan-gyms', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to load')
      setGyms(data.gyms ?? [])
    } catch (err: any) {
      setError(err?.message || 'Failed to load orphan gyms')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function generate(gymId: string) {
    setBusyId(gymId)
    try {
      const res = await fetch(`/api/admin/gyms/${gymId}/claim-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expires_in_days: 14 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to generate')
      setFreshLinks((prev) => ({ ...prev, [gymId]: data.url }))
      await load()
    } catch (err: any) {
      alert(err?.message || 'Failed to generate link')
    } finally {
      setBusyId(null)
    }
  }

  async function revoke(gymId: string) {
    if (!confirm('Revoke the active claim link for this gym? You can re-issue at any time.')) return
    setBusyId(gymId)
    try {
      const res = await fetch(`/api/admin/gyms/${gymId}/claim-link`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to revoke')
      setFreshLinks((prev) => {
        const next = { ...prev }; delete next[gymId]; return next
      })
      await load()
    } catch (err: any) {
      alert(err?.message || 'Failed to revoke link')
    } finally {
      setBusyId(null)
    }
  }

  function copy(url: string) {
    navigator.clipboard?.writeText(url).then(() => {
      // Tiny ack — keep it lightweight; full toast UI would be overkill here.
    })
  }

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase()
    if (!f) return gyms
    return gyms.filter((g) =>
      g.gym_name?.toLowerCase().includes(f) ||
      g.city?.toLowerCase().includes(f) ||
      g.country?.toLowerCase().includes(f) ||
      g.placeholder_email?.toLowerCase().includes(f),
    )
  }, [gyms, filter])

  if (authLoading || (profile && profile.role !== 'admin')) {
    return <div className="p-8 text-stone-500">Loading…</div>
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">
            Admin
          </p>
          <h1 className="text-2xl font-semibold text-stone-900">Orphan gyms</h1>
          <p className="mt-1 text-sm text-stone-600">
            Pre-listed gyms still owned by a placeholder account. Issue a claim
            link and send it to the real owner so they can take over.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by name, city, email…"
            className="rounded-full border border-stone-300 px-4 py-2 text-sm"
          />
          <Button variant="outline" onClick={load} disabled={loading}>
            Refresh
          </Button>
          <Link
            href="/admin"
            className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
          >
            ← Back to admin
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-stone-500">Loading…</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-stone-500">
            No orphan gyms{filter ? ' match that filter' : ''}.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((g) => {
            const t = g.latest_token
            const status = t?.active
              ? 'Active link'
              : t?.claimed_at
                ? 'Claimed (password not yet set)'
                : t?.revoked_at
                  ? 'Revoked'
                  : t?.expired
                    ? 'Expired'
                    : 'No link yet'
            return (
              <Card key={g.gym_id} className="overflow-hidden">
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{g.gym_name || 'Untitled gym'}</CardTitle>
                    <p className="mt-0.5 text-xs text-stone-500">
                      {[g.city, g.country].filter(Boolean).join(', ') || '—'}
                      {' · '}placeholder: <code>{g.placeholder_email ?? '—'}</code>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={
                        'rounded-full px-2.5 py-0.5 text-xs font-medium ' +
                        (t?.active
                          ? 'bg-emerald-100 text-emerald-800'
                          : t?.expired
                            ? 'bg-amber-100 text-amber-800'
                            : t?.revoked_at
                              ? 'bg-stone-200 text-stone-700'
                              : 'bg-stone-100 text-stone-600')
                      }
                    >
                      {status}
                    </span>
                    <span className="text-[11px] text-stone-500">
                      {g.claim_password_set ? 'Password set' : 'Password not set'}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {t && (
                    <p className="text-xs text-stone-500">
                      Last link issued {new Date(t.created_at).toLocaleString()},
                      {' '}expires {new Date(t.expires_at).toLocaleString()}
                      {t.claimed_at ? ` · claimed ${new Date(t.claimed_at).toLocaleString()}` : ''}
                      {t.revoked_at ? ` · revoked ${new Date(t.revoked_at).toLocaleString()}` : ''}
                    </p>
                  )}

                  {freshLinks[g.gym_id] && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                      <p className="text-xs font-medium text-emerald-800">
                        New claim link (copy now — we won't show it again):
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          readOnly
                          value={freshLinks[g.gym_id]}
                          className="flex-1 rounded border border-emerald-300 bg-white px-2 py-1 text-xs"
                          onFocus={(e) => e.currentTarget.select()}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copy(freshLinks[g.gym_id])}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => generate(g.gym_id)}
                      disabled={busyId === g.gym_id}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      {busyId === g.gym_id
                        ? 'Working…'
                        : t?.active
                          ? 'Regenerate link'
                          : 'Generate claim link'}
                    </Button>
                    {t?.active && (
                      <Button
                        variant="outline"
                        onClick={() => revoke(g.gym_id)}
                        disabled={busyId === g.gym_id}
                      >
                        Revoke
                      </Button>
                    )}
                    <Link
                      href={`/gyms/${g.gym_id}`}
                      className="ml-auto rounded-full border border-stone-200 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50"
                    >
                      View listing
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </main>
  )
}
