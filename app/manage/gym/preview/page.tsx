import { Suspense } from 'react'
import { GymListingPreviewInner } from './preview-inner'

export default function ManageGymPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-10 max-w-6xl mx-auto space-y-6">
          <div className="h-10 w-64 bg-gray-100 rounded animate-pulse" />
          <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      }
    >
      <GymListingPreviewInner />
    </Suspense>
  )
}
