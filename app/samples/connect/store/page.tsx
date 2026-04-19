'use client'

/**
 * Storefront: lists **platform** products tagged with `metadata.connect_demo=true`,
 * and starts **Checkout** with destination charge + application fee.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'

type ProductRow = {
  id: string
  name: string
  description: string | null
  metadata: Record<string, string>
  default_price: { id: string; unit_amount: number | null; currency: string } | null
}

const DEMO_ACCOUNT_STORAGE = 'connect_demo_v2_account_id'

export default function SamplesConnectStorePage() {
  const [products, setProducts] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyPrice, setBusyPrice] = useState<string | null>(null)

  const [newName, setNewName] = useState('1 week training pass')
  const [newDesc, setNewDesc] = useState('Sample listing — demo only')
  const [newCents, setNewCents] = useState(9999)
  const [destination, setDestination] = useState('')
  const [sellerLabel, setSellerLabel] = useState('My gym')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    try {
      const id = localStorage.getItem(DEMO_ACCOUNT_STORAGE)
      if (id) setDestination(id)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/samples/connect/products')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load products')
        setProducts(data.products || [])
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const loadProducts = async () => {
    const res = await fetch('/api/samples/connect/products')
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to load products')
    setProducts(data.products || [])
  }

  const createProduct = async () => {
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/samples/connect/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          description: newDesc,
          unit_amount_cents: newCents,
          currency: 'usd',
          connect_demo_destination: destination,
          seller_label: sellerLabel,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create product')
      await loadProducts()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setCreating(false)
    }
  }

  const buy = async (priceId: string) => {
    setBusyPrice(priceId)
    setError(null)
    try {
      const res = await fetch('/api/samples/connect/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_id: priceId, quantity: 1 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Checkout failed')
      if (data.url) window.location.href = data.url as string
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setBusyPrice(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] px-4 py-8 md:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-xl border border-gray-200/90 bg-white p-6 shadow-md">
          <h1 className="text-lg font-semibold text-[#003580]">Storefront (sample)</h1>
          <p className="mt-1 text-sm text-gray-600">
            Products live on the **platform** account. Each product stores{' '}
            <code className="rounded bg-gray-100 px-1 text-xs">connect_demo_destination</code> for the seller payout.
          </p>

          {error ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}

          <div className="mt-8 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-4">
            <h2 className="text-sm font-semibold text-gray-900">Create a platform product (demo)</h2>
            <p className="mt-1 text-xs text-gray-500">
              Uses <code className="rounded bg-white px-1">connect_demo_destination</code> — paste a V2 account id from
              the seller page (saved in localStorage when you create an account there).
            </p>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <label className="block sm:col-span-2">
                Name
                <input
                  className="mt-1 w-full rounded border border-gray-200 px-2 py-1.5"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </label>
              <label className="block sm:col-span-2">
                Description
                <input
                  className="mt-1 w-full rounded border border-gray-200 px-2 py-1.5"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </label>
              <label>
                Price (cents)
                <input
                  type="number"
                  className="mt-1 w-full rounded border border-gray-200 px-2 py-1.5"
                  value={newCents}
                  onChange={(e) => setNewCents(Number(e.target.value))}
                />
              </label>
              <label>
                Seller label
                <input
                  className="mt-1 w-full rounded border border-gray-200 px-2 py-1.5"
                  value={sellerLabel}
                  onChange={(e) => setSellerLabel(e.target.value)}
                />
              </label>
              <label className="block sm:col-span-2">
                Connected account id (destination)
                <input
                  className="mt-1 w-full rounded border border-gray-200 px-2 py-1.5 font-mono text-xs"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="V2 core account id"
                />
              </label>
            </div>
            <button
              type="button"
              disabled={creating || !destination.trim()}
              onClick={() => void createProduct()}
              className="mt-3 rounded-lg bg-[#003580] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create product'}
            </button>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-gray-500">Loading products…</p>
          ) : products.length === 0 ? (
            <p className="mt-6 text-sm text-gray-600">
              No demo products yet. Create a seller account, then add a product from the API or extend this UI with a
              form calling <code className="text-xs">POST /api/samples/connect/products</code>.
            </p>
          ) : (
            <ul className="mt-6 space-y-4">
              {products.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-col gap-2 rounded-lg border border-gray-200/90 bg-gray-50/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-gray-900">{p.name}</p>
                    {p.description ? <p className="text-sm text-gray-600">{p.description}</p> : null}
                    <p className="mt-1 text-xs text-gray-500">
                      Seller: {p.metadata.connect_demo_seller_label || p.metadata.connect_demo_destination || '—'}
                    </p>
                    {p.default_price ? (
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {(p.default_price.unit_amount! / 100).toFixed(2)}{' '}
                        {p.default_price.currency.toUpperCase()}
                      </p>
                    ) : null}
                  </div>
                  {p.default_price ? (
                    <button
                      type="button"
                      disabled={busyPrice === p.default_price.id}
                      onClick={() => void buy(p.default_price!.id)}
                      className="shrink-0 rounded-lg bg-[#003580] px-4 py-2 text-sm font-medium text-white hover:bg-[#002a66] disabled:opacity-50"
                    >
                      {busyPrice === p.default_price.id ? 'Redirecting…' : 'Buy with Checkout'}
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-8 text-center text-sm">
          <Link href="/samples/connect" className="text-[#003580] underline-offset-2 hover:underline">
            ← Sample hub
          </Link>
        </p>
      </div>
    </div>
  )
}
