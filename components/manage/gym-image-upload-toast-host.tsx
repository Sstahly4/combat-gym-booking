'use client'

import { GymImageUploadToast } from '@/components/manage/gym-image-upload-toast'
import { useGymImageUploads } from '@/lib/hooks/use-gym-image-uploads'
import { useAccommodationImageUploads } from '@/lib/hooks/use-accommodation-image-uploads'
import { useTrainerPhotoUploads } from '@/lib/hooks/use-trainer-photo-uploads'
import { cancelGymImageUploads } from '@/lib/manage/gym-image-upload-manager'
import { cancelAccommodationImageUploads } from '@/lib/manage/accommodation-image-upload-manager'
import { cancelTrainerPhotoUploads } from '@/lib/manage/trainer-photo-upload-manager'

/** Global upload progress — survives navigation away from gym edit / package flows. */
export function GymImageUploadToastHost() {
  const { summary: gymSummary } = useGymImageUploads()
  const { summary: accSummary } = useAccommodationImageUploads()
  const { summary: trainerSummary } = useTrainerPhotoUploads()

  const active = gymSummary.active || accSummary.active || trainerSummary.active
  const completed = gymSummary.completed + accSummary.completed + trainerSummary.completed
  const failed = gymSummary.failed + accSummary.failed + trainerSummary.failed
  const total = gymSummary.total + accSummary.total + trainerSummary.total

  return (
    <GymImageUploadToast
      active={active}
      completed={completed}
      failed={failed}
      total={total}
      onCancel={() => {
        cancelGymImageUploads()
        cancelAccommodationImageUploads()
        cancelTrainerPhotoUploads()
      }}
    />
  )
}
