'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import type { Offer } from '@/lib/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Calendar, Edit2, Plus, RefreshCw, Sparkles, Trash2 } from 'lucide-react'

type OfferForm = {
  label: string
  title: string
  description: string
  image_url: string
  cta_text: string
  cta_url: string
  expires_at: string
  is_active: boolean
}

const emptyForm: OfferForm = {
  label: '',
  title: '',
  description: '',
  image_url: '',
  cta_text: '',
  cta_url: '',
  expires_at: '',
  is_active: true,
}

function toDatetimeLocal(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function fromDatetimeLocal(value: string) {
  return value ? new Date(value).toISOString() : null
}

export default function AdminOffersPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null)
  const [form, setForm] = useState<OfferForm>(emptyForm)

  const fetchOffers = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError(null)
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('offers')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      setOffers((data || []) as Offer[])
    } catch (err: any) {
      console.error('Error fetching offers:', err)
      setError(err.message || 'Failed to load offers')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.replace('/auth/signin?redirect=/admin/offers')
      return
    }

    if (profile?.role !== 'admin') {
      router.replace('/')
      return
    }

    fetchOffers()
  }, [user, profile, authLoading, router, fetchOffers])

  const resetForm = () => {
    setEditingOfferId(null)
    setForm(emptyForm)
  }

  const handleEdit = (offer: Offer) => {
    setEditingOfferId(offer.id)
    setForm({
      label: offer.label,
      title: offer.title,
      description: offer.description,
      image_url: offer.image_url || '',
      cta_text: offer.cta_text,
      cta_url: offer.cta_url,
      expires_at: toDatetimeLocal(offer.expires_at),
      is_active: offer.is_active,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const label = form.label.trim()
    const title = form.title.trim()
    const description = form.description.trim()
    const ctaText = form.cta_text.trim()
    const ctaUrl = form.cta_url.trim()

    if (!label || !title || !description || !ctaText || !ctaUrl) {
      setError('Please fill in all required fields.')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const supabase = createClient()
      const payload = {
        label,
        title,
        description,
        image_url: form.image_url.trim() || null,
        cta_text: ctaText,
        cta_url: ctaUrl,
        expires_at: fromDatetimeLocal(form.expires_at),
        is_active: form.is_active,
      }

      const response = editingOfferId
        ? await supabase.from('offers').update(payload).eq('id', editingOfferId)
        : await supabase.from('offers').insert(payload)

      if (response.error) {
        throw response.error
      }

      await fetchOffers()
      resetForm()
    } catch (err: any) {
      console.error('Error saving offer:', err)
      setError(err.message || 'Failed to save offer')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (offer: Offer) => {
    if (!confirm(`Delete "${offer.title}"? This cannot be undone.`)) return

    try {
      setSaving(true)
      setError(null)
      const supabase = createClient()
      const { error: deleteError } = await supabase.from('offers').delete().eq('id', offer.id)
      if (deleteError) throw deleteError

      if (editingOfferId === offer.id) {
        resetForm()
      }

      await fetchOffers()
    } catch (err: any) {
      console.error('Error deleting offer:', err)
      setError(err.message || 'Failed to delete offer')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (offer: Offer) => {
    try {
      setSaving(true)
      setError(null)
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('offers')
        .update({ is_active: !offer.is_active })
        .eq('id', offer.id)

      if (updateError) throw updateError
      await fetchOffers()
    } catch (err: any) {
      console.error('Error updating offer status:', err)
      setError(err.message || 'Failed to update offer')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-10 w-40 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="h-[560px] bg-white rounded-xl border border-gray-200 animate-pulse" />
            <div className="space-y-4">
              <div className="h-28 bg-white rounded-xl border border-gray-200 animate-pulse" />
              <div className="h-28 bg-white rounded-xl border border-gray-200 animate-pulse" />
              <div className="h-28 bg-white rounded-xl border border-gray-200 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-lg mb-4">Please sign in to access offers management.</p>
              <Button onClick={() => router.push('/auth/signin?redirect=/admin/offers')}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Admin Access Required</CardTitle>
              <CardDescription>You need admin privileges to manage offers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => window.location.reload()} className="w-full">
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-3">
              <ArrowLeft className="w-4 h-4" />
              Back to Admin
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Sparkles className="w-7 h-7 text-[#003580]" />
              Offers
            </h1>
            <p className="text-gray-600 mt-2">Create and manage homepage promotions.</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              New Offer
            </Button>
            <Button
              variant="outline"
              onClick={() => fetchOffers(true)}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="py-4">
              <p className="text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-6">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>{editingOfferId ? 'Edit Offer' : 'Create Offer'}</CardTitle>
              <CardDescription>
                Use this form to build the cards shown above Trending Destinations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="label">Label *</Label>
                  <Input
                    id="label"
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    placeholder="Early 2026 Deals"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="At least 15% off"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Save on your next stay..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cta_text">CTA Text *</Label>
                    <Input
                      id="cta_text"
                      value={form.cta_text}
                      onChange={(e) => setForm({ ...form, cta_text: e.target.value })}
                      placeholder="Explore deals"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cta_url">CTA URL *</Label>
                    <Input
                      id="cta_url"
                      value={form.cta_url}
                      onChange={(e) => setForm({ ...form, cta_url: e.target.value })}
                      placeholder="/search?deal=offers"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expires_at" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Expires At
                  </Label>
                  <Input
                    id="expires_at"
                    type="datetime-local"
                    value={form.expires_at}
                    onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                  />
                </div>

                <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Active</div>
                    <div className="text-sm text-gray-500">Only active offers are visible on the homepage.</div>
                  </div>
                </label>

                <div className="flex items-center gap-3 pt-2">
                  <Button type="submit" className="bg-[#003580] hover:bg-[#003580]/90 text-white" disabled={saving}>
                    {saving ? 'Saving...' : editingOfferId ? 'Update Offer' : 'Create Offer'}
                  </Button>
                  {editingOfferId && (
                    <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
                      Cancel Editing
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Current Offers</h2>
              <p className="text-sm text-gray-500">{offers.length} total</p>
            </div>

            {offers.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-200">
                <CardContent className="py-12 text-center">
                  <Sparkles className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium text-gray-700 mb-1">No offers yet</p>
                  <p className="text-sm text-gray-500">Create the first homepage promotion from the form on the left.</p>
                </CardContent>
              </Card>
            ) : (
              offers.map((offer) => (
                <Card key={offer.id} className="overflow-hidden border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        {offer.image_url ? (
                          <img src={offer.image_url} alt={offer.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-500">{offer.label}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            offer.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {offer.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{offer.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{offer.description}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-3 text-sm">
                          <Link
                            href={offer.cta_url}
                            className="inline-flex items-center rounded-md bg-[#003580] px-3 py-2 font-medium text-white hover:bg-[#003580]/90 transition-colors"
                          >
                            {offer.cta_text}
                          </Link>
                          {offer.expires_at && (
                            <span className="text-xs text-gray-500">
                              Expires {new Date(offer.expires_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(offer)} disabled={saving}>
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toggleActive(offer)} disabled={saving}>
                        {offer.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(offer)}
                        disabled={saving}
                        className="text-red-500 hover:text-red-700 hover:border-red-300"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
