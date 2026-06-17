'use client'

import { useState } from 'react'
import { OfferStepper } from '@/components/manage/offer-stepper'
import { PackageSeasonalPricingPanel } from '@/components/manage/package-seasonal-pricing-panel'
import type { Package } from '@/lib/types/database'
import { cn } from '@/lib/utils'
import { ChevronRight, ImageIcon, FileText, CalendarRange } from 'lucide-react'

type PackageEditTab = 'details' | 'media' | 'pricing-seasons'

const TABS: { id: PackageEditTab; label: string; icon: React.ElementType }[] = [
  { id: 'details', label: 'Details', icon: FileText },
  { id: 'media', label: 'Media', icon: ImageIcon },
  { id: 'pricing-seasons', label: 'Pricing & Seasons', icon: CalendarRange },
]

export function PackageEditShell({
  gymId,
  currency,
  package: pkg,
  onClose,
  onUpdated,
}: {
  gymId: string
  currency: string
  package: Package
  onClose: () => void
  onUpdated: () => void
}) {
  const [tab, setTab] = useState<PackageEditTab>('details')

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-4 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Back to packages
          </button>
          <span className="text-sm text-gray-300">|</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{pkg.name}</p>
            <p className="text-xs text-gray-500">Edit package</p>
          </div>
        </div>

        <nav
          className="flex gap-1 overflow-x-auto border-t border-gray-100 px-4 pb-0 sm:px-6"
          aria-label="Package editor sections"
        >
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
                tab === id
                  ? 'border-[#003580] text-[#003580]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'details' ? (
          <OfferStepper
            gymId={gymId}
            currency={currency}
            existingPackage={pkg}
            embedded
            onComplete={() => {
              onUpdated()
              onClose()
            }}
          />
        ) : null}

        {tab === 'media' ? (
          <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Package media</h2>
              <p className="mt-1 text-sm text-gray-500">
                Cover image and gallery assets shown on your public listing.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              {pkg.image ? (
                <img src={pkg.image} alt="" className="aspect-video w-full object-cover" />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-gray-100">
                  <ImageIcon className="h-10 w-10 text-gray-300" />
                </div>
              )}
              <div className="border-t border-gray-100 px-4 py-4">
                <p className="text-sm text-gray-600">
                  To update the cover image, open the <strong>Details</strong> tab and go to Basic
                  Information.
                </p>
                <button
                  type="button"
                  onClick={() => setTab('details')}
                  className="mt-3 text-sm font-medium text-[#003580] hover:underline"
                >
                  Go to Details →
                </button>
              </div>
            </div>

            {pkg.variants && pkg.variants.length > 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-gray-900">Room / tier images</p>
                <p className="mt-1 text-xs text-gray-500">
                  {pkg.variants.length} variant{pkg.variants.length !== 1 ? 's' : ''} with optional
                  images — managed in Details → Pricing &amp; Accommodation.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {tab === 'pricing-seasons' ? (
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
            <PackageSeasonalPricingPanel
              package={pkg}
              currency={pkg.currency || currency}
              variants={pkg.variants}
            />
          </div>
        ) : null}
      </main>
    </div>
  )
}
