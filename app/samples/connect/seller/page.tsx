'use client'

/**
 * Seller UI: create a V2 **recipient** connected account, open **Account Link** onboarding,
 * and display **live** status from `GET /api/samples/connect/accounts?id=...` (no DB cache).
 */
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'connect_demo_v2_account_id'

export default function SamplesConnectSellerPage() {
  const [displayName, setDisplayName] = useState('Demo Muay Thai Gym')
  const [email, setEmail] = useState('')
  const [country, setCountry] = useState('us')
  const [accountId, setAccountId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusJson, setStatusJson] = useState<string | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setAccountId(stored)
    } catch {
      /* ignore */
    }
  }, [])

  const persistAccountId = (id: string) => {
    setAccountId(id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      /* ignore */
    }
  }

  const createAccount = async () => {
    setLoading(true)
    setError(null)
    setStatusJson(null)
    try {
      const res = await fetch('/api/samples/connect/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName,
          contact_email: email,
          country,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      persistAccountId(data.id)
      setStatusJson(JSON.stringify(data, null, 2))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  const refreshStatus = useCallback(async () => {
    if (!accountId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/samples/connect/accounts?id=${encodeURIComponent(accountId)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setStatusJson(JSON.stringify(data, null, 2))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }, [accountId])

  const openOnboarding = async () => {
    if (!accountId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/samples/connect/account-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: accountId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      if (data.url) window.location.href = data.url as string
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const aid = params.get('accountId')
    if (params.get('onboarding') === 'return' && aid) {
      persistAccountId(aid)
      void (async () => {
        setLoading(true)
        setError(null)
        try {
          const res = await fetch(`/api/samples/connect/accounts?id=${encodeURIComponent(aid)}`)
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Failed')
          setStatusJson(JSON.stringify(data, null, 2))
        } catch (e: unknown) {
          setError(e instanceof Error ? e.message : 'Error')
        } finally {
          setLoading(false)
        }
      })()
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#f4f6f9] px-4 py-8 md:px-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-xl border border-gray-200/90 bg-white p-6 shadow-md">
          <h1 className="text-lg font-semibold text-[#003580]">Seller: Connect onboarding (V2)</h1>
          <p className="mt-1 text-sm text-gray-600">
            Step 1 — create a connected account. Step 2 — onboard to collect payments (recipient). Status is always
            loaded from Stripe.
          </p>

          <div className="mt-6 space-y-3 text-sm">
            <label className="block">
              <span className="text-gray-700">Display name</span>
              <input
                className="mt-1 w-full rounded border border-gray-200 px-3 py-2"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-gray-700">Contact email</span>
              <input
                type="email"
                className="mt-1 w-full rounded border border-gray-200 px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>
            <label className="block">
              <span className="text-gray-700">Country (ISO alpha-2)</span>
              <input
                className="mt-1 w-full rounded border border-gray-200 px-3 py-2"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </label>
          </div>

          {error ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={loading || !email.trim()}
              onClick={() => void createAccount()}
              className="rounded-lg bg-[#003580] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Create connected account
            </button>
            <button
              type="button"
              disabled={loading || !accountId}
              onClick={() => void openOnboarding()}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 disabled:opacity-50"
            >
              Onboard to collect payments
            </button>
            <button
              type="button"
              disabled={loading || !accountId}
              onClick={() => void refreshStatus()}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 disabled:opacity-50"
            >
              Refresh status from API
            </button>
          </div>

          {accountId ? (
            <p className="mt-4 font-mono text-xs text-gray-500 break-all">
              Account id: {accountId}
            </p>
          ) : null}
        </div>

        {statusJson ? (
          <div className="rounded-xl border border-gray-200/90 bg-white p-6 shadow-md">
            <h2 className="text-sm font-semibold text-gray-900">Live API response</h2>
            <pre className="mt-3 max-h-96 overflow-auto rounded bg-gray-50 p-3 text-xs text-gray-800">{statusJson}</pre>
          </div>
        ) : null}

        <p className="text-center text-sm">
          <Link href="/samples/connect" className="text-[#003580] underline-offset-2 hover:underline">
            ← Sample hub
          </Link>
        </p>
      </div>
    </div>
  )
}
