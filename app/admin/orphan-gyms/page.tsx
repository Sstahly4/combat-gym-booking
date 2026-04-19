'use client'

/**
 * Admin → Orphan / pre-listed gyms.
 *
 * Lists every gym waiting to be handed over to a real owner — either:
 *   • already owned by a synthetic placeholder profile (a claim link was issued
 *     in the past, the owner just hasn't finished setup), or
 *   • owned by an admin profile and explicitly flagged `is_pre_listed = true`
 *     (admin pre-created it; first claim-link generation will mint the
 *     placeholder and reassign ownership).
 *
 * From here the admin can:
 *   - Generate a fresh claim link (revokes any prior active link)
 *   - Copy the link to clipboard (only shown once after generation)
 *   - Revoke the active link without re-issuing
 *
 * The plaintext URL is never persisted server-side — generate again any time.
 *
 * Page-level auth guard lives in `app/admin/layout.tsx`.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type OrphanState = 'placeholder' | 'pre_listed'

interface OrphanGym {
  gym_id: string
  gym_name: string
  city: string | null
  country: string | null
  created_at: string
  is_live: boolean
  status: string
  state: OrphanState
  placeholder_owner_id: string
  placeholder_email: string | null
  claim_password_set: boolean
  is_pre_listed: boolean
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
  const [gyms, setGyms] = useState<OrphanGym[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [freshLinks, setFreshLinks] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState('')

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
    navigator.clipboard?.writeText(url)
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

  const preListed = filtered.filter((g) => g.state === 'pre_listed')
  const placeholders = filtered.filter((g) => g.state === 'placeholder')

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">
            Admin
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-stone-900">Claim links</h1>
          <p className="mt-1 max-w-prose text-sm text-stone-600">
            Pre-listed gyms ready to be handed over to a real owner. Generating
            a link mints a placeholder owner (first time only) and gives you a
            single-use URL to send the gym owner.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by name, city, email…"
            className="rounded-full border border-stone-300 px-4 py-2 text-sm"
          />
          <Button variant="outline" onClick={load} disabled={loading} className="rounded-full">
            Refresh
          </Button>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-stone-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-stone-500">
            {filter
              ? 'No gyms match that filter.'
              : (
                <>
                  No gyms ready for claim links yet.
                  <br />
                  Mark gyms as <span className="font-semibold text-stone-700">pre-listed</span>{' '}
                  from{' '}
                  <Link href="/admin/gyms" className="text-orange-600 underline-offset-2 hover:underline">
                    /admin/gyms
                  </Link>{' '}
                  to surface them here.
                </>
              )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-10">
          {preListed.length > 0 && (
            <Section
              title="Pre-listed (no link issued yet)"
              description="Admin-created gyms flagged as ready for handoff. Generating the first claim link will mint a placeholder owner and reassign the gym to it."
              count={preListed.length}
            >
              {preListed.map((g) => (
                <OrphanCard
                  key={g.gym_id}
                  gym={g}
                  busy={busyId === g.gym_id}
                  freshLink={freshLinks[g.gym_id]}
                  onGenerate={() => generate(g.gym_id)}
                  onRevoke={() => revoke(g.gym_id)}
                  onCopy={copy}
                />
              ))}
            </Section>
          )}

          {placeholders.length > 0 && (
            <Section
              title="Placeholder owner (claim in progress)"
              description="Gyms already transferred to a synthetic placeholder. You can regenerate a link any time without losing ownership."
              count={placeholders.length}
            >
              {placeholders.map((g) => (
                <OrphanCard
                  key={g.gym_id}
                  gym={g}
                  busy={busyId === g.gym_id}
                  freshLink={freshLinks[g.gym_id]}
                  onGenerate={() => generate(g.gym_id)}
                  onRevoke={() => revoke(g.gym_id)}
                  onCopy={copy}
                />
              ))}
            </Section>
          )}
        </div>
      )}
    </main>
  )
}

function Section({
  title,
  description,
  count,
  children,
}: {
  title: string
  description: string
  count: number
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-stone-900">
            {title}{' '}
            <span className="ml-1 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
              {count}
            </span>
          </h2>
          <p className="mt-0.5 text-xs text-stone-500">{description}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function OrphanCard({
  gym,
  busy,
  freshLink,
  onGenerate,
  onRevoke,
  onCopy,
}: {
  gym: OrphanGym
  busy: boolean
  freshLink: string | undefined
  onGenerate: () => void
  onRevoke: () => void
  onCopy: (url: string) => void
}) {
  const t = gym.latest_token
  const isPreListed = gym.state === 'pre_listed'

  const status = isPreListed && !t
    ? 'Awaiting first link'
    : t?.active
      ? 'Active link'
      : t?.claimed_at
        ? 'Claimed (password not yet set)'
        : t?.revoked_at
          ? 'Revoked'
          : t?.expired
            ? 'Expired'
            : 'No link yet'

  const statusClass =
    isPreListed && !t
      ? 'bg-orange-100 text-orange-800'
      : t?.active
        ? 'bg-emerald-100 text-emerald-800'
        : t?.expired
          ? 'bg-amber-100 text-amber-800'
          : t?.revoked_at
            ? 'bg-stone-200 text-stone-700'
            : 'bg-stone-100 text-stone-600'

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="text-base">{gym.gym_name || 'Untitled gym'}</CardTitle>
          <p className="mt-0.5 text-xs text-stone-500">
            {[gym.city, gym.country].filter(Boolean).join(', ') || '—'}
            {gym.placeholder_email && (
              <>
                {' · '}placeholder: <code>{gym.placeholder_email}</code>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}>
            {status}
          </span>
          {!isPreListed && (
            <span className="text-[11px] text-stone-500">
              {gym.claim_password_set ? 'Password set' : 'Password not set'}
            </span>
          )}
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

        {freshLink && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
            <p className="text-xs font-medium text-emerald-800">
              New claim link (copy now — we won't show it again):
            </p>
            <div className="mt-1 flex items-center gap-2">
              <input
                readOnly
                value={freshLink}
                className="flex-1 rounded border border-emerald-300 bg-white px-2 py-1 text-xs"
                onFocus={(e) => e.currentTarget.select()}
              />
              <Button size="sm" variant="outline" onClick={() => onCopy(freshLink)}>
                Copy
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={onGenerate}
            disabled={busy}
            className="rounded-full bg-orange-600 text-white hover:bg-orange-700"
          >
            {busy
              ? 'Working…'
              : t?.active
                ? 'Regenerate link'
                : isPreListed && !t
                  ? 'Generate first link'
                  : 'Generate claim link'}
          </Button>
          {t?.active && (
            <Button variant="outline" onClick={onRevoke} disabled={busy} className="rounded-full">
              Revoke
            </Button>
          )}
          <Link
            href={`/gyms/${gym.gym_id}`}
            className="ml-auto rounded-full border border-stone-200 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50"
          >
            View listing
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
