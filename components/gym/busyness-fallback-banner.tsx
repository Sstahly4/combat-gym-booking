'use client'

import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { MatCapacityInfoModal } from '@/components/gym/mat-capacity-info-modal'

export function BusynessFallbackBanner() {
  const [infoOpen, setInfoOpen] = useState(false)

  return (
    <div>
      <div className="mb-3 flex items-center gap-1.5">
        <h3 className="text-[15px] font-semibold tracking-tight text-gray-900">
          Mat Capacity
        </h3>
        <button
          type="button"
          onClick={() => setInfoOpen(true)}
          className="text-gray-400 transition-colors hover:text-gray-600"
          aria-label="About mat capacity"
        >
          <HelpCircle className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
      <MatCapacityInfoModal
        open={infoOpen}
        onOpenChange={setInfoOpen}
        source="unknown"
      />
      <p className="text-sm text-gray-500">
        Busyness data isn&apos;t available for this gym yet.
      </p>
      <p className="mt-1 text-xs text-gray-400">
        Peak training is often around 4:00–6:00 PM.
      </p>
    </div>
  )
}
