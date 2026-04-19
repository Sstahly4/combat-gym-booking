'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { OfferStepper } from './offer-stepper'
import { AccommodationQuickModal } from './accommodation-quick-modal'
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
} from 'lucide-react'

export interface OnboardingPackagesPanelProps {
  open: boolean
  gymId: string
  currency: string
  onClose: () => void
  onPackagesChanged?: () => void
}

const OFFER_TYPE_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  TYPE_TRAINING_ONLY: { label: 'Training Only', color: 'bg-blue-100 text-blue-700', icon: Dumbbell },
  TYPE_TRAINING_ACCOM: { label: 'Training + Accom', color: 'bg-green-100 text-green-700', icon: BedDouble },
  TYPE_ALL_INCLUSIVE: { label: 'All-Inclusive', color: 'bg-purple-100 text-purple-700', icon: UtensilsCrossed },
  TYPE_CUSTOM_EXP: { label: 'Short-term Experience', color: 'bg-orange-100 text-orange-700', icon: Calendar },
  TYPE_ONE_TIME_EVENT: { label: 'One-Time Event', color: 'bg-amber-100 text-amber-700', icon: Ticket },
}

/**
 * Packages editor overlay for the owner onboarding wizard — same shell as the main wizard (padded backdrop + rounded card).
 * Reuses OfferStepper in embedded mode (no full-page gray shell).
 */
export function OnboardingPackagesPanel({
  open,
  gymId,
  currency,
  onClose,
  onPackagesChanged,
}: OnboardingPackagesPanelProps) {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [showStepper, setShowStepper] = useState(false)
  const [editingPackage, setEditingPackage] = useState<Package | null>(null)
  const [accommodationModalOpen, setAccommodationModalOpen] = useState(false)

  useEffect(() => {
    if (!open) {
      setShowStepper(false)
      setEditingPackage(null)
    }
  }, [open])

  useEffect(() => {
    if (!open || !gymId) return
    void fetchPackages()
  }, [gymId, open])

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

  const notifyChanged = () => {
    onPackagesChanged?.()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this offer? This cannot be undone.')) return
    const supabase = createClient()
    await supabase.from('packages').delete().eq('id', id)
    await fetchPackages()
    notifyChanged()
  }

  const openCreate = () => {
    setEditingPackage(null)
    setShowStepper(true)
  }

  const openEdit = (pkg: Package) => {
    setEditingPackage(pkg)
    setShowStepper(true)
  }

  const handleStepperComplete = () => {
    setShowStepper(false)
    setEditingPackage(null)
    void (async () => {
      await fetchPackages()
      notifyChanged()
    })()
  }

  const handleStepperClose = () => {
    setShowStepper(false)
    setEditingPackage(null)
  }

  if (!open) return null

  const titleId = showStepper ? 'onboarding-packages-stepper-label' : 'onboarding-packages-panel-title'

  return (
    <>
    <AccommodationQuickModal
      open={accommodationModalOpen}
      onOpenChange={setAccommodationModalOpen}
      gymId={gymId}
      currency={currency}
      onSaved={notifyChanged}
    />
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-[#f4f6f9]/95 backdrop-blur-[1px] px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-12 lg:px-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="mx-auto w-full max-w-7xl pb-4">
        <div className="flex max-h-[calc(100dvh-3rem)] flex-col overflow-hidden rounded-xl border border-gray-200/90 bg-white shadow-md sm:max-h-[calc(100dvh-4.5rem)] md:max-h-[calc(100dvh-6.5rem)]">
          {/* Header — matches wizard main card header */}
          {showStepper ? (
            <header className="shrink-0 border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/40 px-5 py-4 md:px-8 md:py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleStepperClose}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" aria-hidden />
                    Back to offer list
                  </button>
                  <span className="hidden text-sm text-gray-400 sm:inline" aria-hidden>
                    |
                  </span>
                  <span id={titleId} className="text-sm text-gray-600">
                    {editingPackage ? `Editing: ${editingPackage.name}` : 'New offer'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 self-start text-sm font-semibold text-[#003580] hover:underline sm:self-auto"
                >
                  Back to Packages &amp; pricing
                </button>
              </div>
            </header>
          ) : (
            <header className="shrink-0 border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/40 px-5 py-5 md:px-8 md:py-6 lg:px-10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2
                    id={titleId}
                    className="text-lg font-semibold tracking-tight text-[#003580] md:text-xl"
                  >
                    Packages &amp; base pricing
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    Add offers and set prices — you stay in onboarding.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex shrink-0 items-center gap-1.5 self-start text-sm font-medium text-gray-600 hover:text-gray-900 sm:self-center"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" aria-hidden />
                  Close
                </button>
              </div>
            </header>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {showStepper ? (
              <div className="p-4 pb-8 md:p-6 md:pb-10 lg:px-8">
                <OfferStepper
                  gymId={gymId}
                  currency={currency}
                  onComplete={handleStepperComplete}
                  existingPackage={editingPackage}
                  embedded
                />
              </div>
            ) : (
              <div className="space-y-6 p-5 md:space-y-8 md:p-8 lg:px-10 lg:py-10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    {packages.length} offer{packages.length !== 1 ? 's' : ''}
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-gray-200 bg-white"
                      onClick={() => setAccommodationModalOpen(true)}
                    >
                      <BedDouble className="mr-2 h-4 w-4" />
                      Add or edit accommodation
                    </Button>
                    <Button onClick={openCreate} className="bg-[#003580] text-white hover:bg-[#003580]/90">
                      <Plus className="mr-2 h-4 w-4" />
                      Create new offer
                    </Button>
                  </div>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
                    ))}
                  </div>
                ) : packages.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/40 py-12 text-center text-gray-400">
                    <Ticket className="mx-auto mb-3 h-10 w-10 opacity-40" aria-hidden />
                    <p className="mb-1 font-medium text-gray-700">No offers yet</p>
                    <p className="text-sm text-muted-foreground">
                      Create your first offer with a name, type, and base pricing.
                    </p>
                    <Button onClick={openCreate} variant="outline" className="mt-4 border-gray-200 bg-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Create offer
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {packages.map((pkg) => {
                      const meta = OFFER_TYPE_META[pkg.offer_type] || OFFER_TYPE_META.TYPE_TRAINING_ONLY
                      const Icon = meta.icon

                      const priceLabel =
                        pkg.offer_type === 'TYPE_ONE_TIME_EVENT'
                          ? pkg.variants && pkg.variants.length > 0
                            ? `${pkg.variants.length} ticket tier${pkg.variants.length !== 1 ? 's' : ''}`
                            : pkg.price_per_day
                              ? `${pkg.currency} ${pkg.price_per_day.toLocaleString()} / ticket`
                              : null
                          : pkg.price_per_week
                            ? `${pkg.currency} ${pkg.price_per_week.toLocaleString()} / week`
                            : pkg.price_per_day
                              ? `${pkg.currency} ${pkg.price_per_day.toLocaleString()} / day`
                              : null

                      return (
                        <div
                          key={pkg.id}
                          className="flex flex-col gap-3 rounded-xl border border-gray-200/90 bg-gray-50/60 p-4 transition-colors hover:border-gray-300 sm:flex-row sm:items-center"
                        >
                          <div className="flex min-w-0 flex-1 items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm">
                              {pkg.image ? (
                                <img src={pkg.image} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <Icon className="h-6 w-6 text-gray-400" aria-hidden />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="mb-0.5 flex flex-wrap items-center gap-2">
                                <p className="truncate text-sm font-semibold text-gray-900">{pkg.name}</p>
                                <span
                                  className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.color}`}
                                >
                                  {meta.label}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <span>{pkg.sport}</span>
                                {priceLabel ? (
                                  <span className="font-medium text-gray-700">{priceLabel}</span>
                                ) : null}
                                {pkg.offer_type === 'TYPE_ONE_TIME_EVENT' && pkg.event_date ? (
                                  <span className="flex items-center gap-1 text-amber-600">
                                    <Calendar className="h-3 w-3" aria-hidden />
                                    {new Date(pkg.event_date).toLocaleDateString(undefined, {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2 sm:justify-end">
                            <Button variant="outline" size="sm" onClick={() => openEdit(pkg)} className="h-8 px-3">
                              <Edit2 className="mr-1 h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => void handleDelete(pkg.id)}
                              className="h-8 px-3 text-red-500 hover:border-red-300 hover:text-red-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
