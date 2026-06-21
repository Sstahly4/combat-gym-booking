'use client'

import { GymImageUploadToast } from '@/components/manage/gym-image-upload-toast'
import { useGymImageUploads } from '@/lib/hooks/use-gym-image-uploads'
import { useAccommodationImageUploads } from '@/lib/hooks/use-accommodation-image-uploads'
import { cancelGymImageUploads } from '@/lib/manage/gym-image-upload-manager'
import { cancelAccommodationImageUploads } from '@/lib/manage/accommodation-image-upload-manager'

/** Global upload progress — survives navigation away from gym edit / package flows. */
export function GymImageUploadToastHost() {
  const { summary: gymSummary } = useGymImageUploads()
  const { summary: accSummary } = useAccommodationImageUploads()

  const active = gymSummary.active || accSummary.active
  const completed = gymSummary.completed + accSummary.completed
  const failed = gymSummary.failed + accSummary.failed
  const total = gymSummary.total + accSummary.total

  return (
    <GymImageUploadToast
      active={active}
      completed={completed}
      failed={failed}
      total={total}
      onCancel={() => {
        cancelGymImageUploads()
        cancelAccommodationImageUploads()
      }}
    />
  )
}
