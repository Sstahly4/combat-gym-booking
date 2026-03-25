'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { OfferStepper } from './offer-stepper'
import { Button } from '@/components/ui/button'
import type { Package } from '@/lib/types/database'
import {
  Plus,
  Edit2,
  Trash2,
  Ticket,
  Calendar,
  BedDouble,
  UtensilsCrossed,
  Dumbbell,
  ChevronRight,
  ImageIcon,
} from 'lucide-react'

interface PackagesSectionProps {
  gymId: string
  currency: string
  isAdmin?: boolean
}

const OFFER_TYPE_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  TYPE_TRAINING_ONLY:   { label: 'Training Only',         color: 'bg-blue-100 text-blue-700',   icon: Dumbbell },
  TYPE_TRAINING_ACCOM:  { label: 'Training + Accom',      color: 'bg-green-100 text-green-700',  icon: BedDouble },
  TYPE_ALL_INCLUSIVE:   { label: 'All-Inclusive',          color: 'bg-purple-100 text-purple-700',icon: UtensilsCrossed },
  TYPE_CUSTOM_EXP:      { label: 'Short-term Experience',  color: 'bg-orange-100 text-orange-700',icon: Calendar },
  TYPE_ONE_TIME_EVENT:  { label: 'One-Time Event',         color: 'bg-amber-100 text-amber-700',  icon: Ticket },
}

export function PackagesSection({ gymId, currency }: PackagesSectionProps) {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [showStepper, setShowStepper] = useState(false)
  const [editingPackage, setEditingPackage] = useState<Package | null>(null)

  useEffect(() => {
    fetchPackages()
  }, [gymId])

  const fetchPackages = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('packages')
      .select('*, variants:package_variants(*)')
      .eq('gym_id', gymId)
      .order('created_at')

    if (data) setPackages(data)
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this offer? This cannot be undone.')) return
    const supabase = createClient()
    await supabase.from('packages').delete().eq('id', id)
    fetchPackages()
  }

  const openCreate = () => {
    setEditingPackage(null)
    setShowStepper(true)
  }

  const openEdit = (pkg: Package) => {
    setEditingPackage(pkg)
    setShowStepper(true)
  }

  const handleComplete = () => {
    setShowStepper(false)
    setEditingPackage(null)
    fetchPackages()
  }

  const handleClose = () => {
    setShowStepper(false)
    setEditingPackage(null)
  }

  // ── Full-screen stepper overlay ──────────────────────────────────────────
  if (showStepper) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto">
        {/* Back bar */}
        <div className="bg-white border-b px-4 py-3 flex items-center gap-4 sticky top-0 z-20">
          <button
            type="button"
            onClick={handleClose}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to packages
          </button>
          <span className="text-sm text-gray-400">|</span>
          <span className="text-sm text-gray-600">
            {editingPackage ? `Editing: ${editingPackage.name}` : 'New Offer'}
          </span>
        </div>

        <OfferStepper
          gymId={gymId}
          currency={currency}
          onComplete={handleComplete}
          existingPackage={editingPackage}
        />
      </div>
    )
  }

  // ── Package list ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {packages.length} offer{packages.length !== 1 ? 's' : ''}
        </p>
        <Button
          onClick={openCreate}
          className="bg-[#003580] hover:bg-[#003580]/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Offer
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed rounded-lg text-gray-400">
          <Ticket className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium text-gray-600 mb-1">No offers yet</p>
          <p className="text-sm">Create your first offer to start accepting bookings.</p>
          <Button onClick={openCreate} variant="outline" className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Create Offer
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {packages.map(pkg => {
            const meta = OFFER_TYPE_META[pkg.offer_type] || OFFER_TYPE_META['TYPE_TRAINING_ONLY']
            const Icon = meta.icon

            const priceLabel = pkg.offer_type === 'TYPE_ONE_TIME_EVENT'
              ? (pkg.variants && pkg.variants.length > 0
                  ? `${pkg.variants.length} ticket tier${pkg.variants.length !== 1 ? 's' : ''}`
                  : pkg.price_per_day ? `${pkg.currency} ${pkg.price_per_day.toLocaleString()} / ticket` : null)
              : pkg.price_per_week
                ? `${pkg.currency} ${pkg.price_per_week.toLocaleString()} / week`
                : pkg.price_per_day
                  ? `${pkg.currency} ${pkg.price_per_day.toLocaleString()} / day`
                  : null

            return (
              <div
                key={pkg.id}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                  {pkg.image ? (
                    <img src={pkg.image} alt={pkg.name} className="w-full h-full object-cover" />
                  ) : (
                    <Icon className="w-6 h-6 text-gray-400" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="font-semibold text-sm text-gray-900 truncate">{pkg.name}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${meta.color}`}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                    <span>{pkg.sport}</span>
                    {priceLabel && <span className="font-medium text-gray-700">{priceLabel}</span>}
                    {pkg.offer_type === 'TYPE_ONE_TIME_EVENT' && pkg.event_date && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Calendar className="w-3 h-3" />
                        {new Date(pkg.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(pkg)}
                    className="h-8 px-3"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(pkg.id)}
                    className="h-8 px-3 text-red-500 hover:text-red-700 hover:border-red-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
