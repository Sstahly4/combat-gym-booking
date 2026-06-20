'use client'

import { Button } from '@/components/ui/button'
import { Loader2, Upload } from 'lucide-react'

export function GymImageUploadToast({
  active,
  completed,
  failed,
  total,
  onCancel,
}: {
  active: boolean
  completed: number
  failed: number
  total: number
  onCancel: () => void
}) {
  if (!active || total === 0) return null

  const done = completed + failed
  const inProgress = Math.max(0, total - done)

  return (
    <div
      className="fixed bottom-6 right-4 z-[65] w-[min(100vw-2rem,22rem)] rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg md:right-8"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#003580]/10 text-[#003580]">
          {inProgress > 0 ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Upload className="h-4 w-4" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900">
            {inProgress > 0 ? `Uploading ${inProgress} photo${inProgress === 1 ? '' : 's'}…` : 'Uploads finished'}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {done}/{total} complete
            {failed > 0 ? ` · ${failed} failed` : ''}
          </p>
          {inProgress > 0 ? (
            <p className="mt-1 text-xs text-gray-500">
              Uploads continue in the background — you can leave this page.
            </p>
          ) : null}
        </div>
        {inProgress > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0 text-xs"
            onClick={onCancel}
          >
            Cancel
          </Button>
        ) : null}
      </div>
    </div>
  )
}
