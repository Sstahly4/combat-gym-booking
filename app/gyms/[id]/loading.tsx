'use client'

import { LoadingOverlay } from '@/components/loading-overlay'

export default function Loading() {
  return (
    <div className="min-h-[100dvh] bg-white">
      <LoadingOverlay show={true} />
    </div>
  )
}
