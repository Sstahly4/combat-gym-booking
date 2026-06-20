'use client'

import { GymImageUploadToast } from '@/components/manage/gym-image-upload-toast'
import { useGymImageUploads } from '@/lib/hooks/use-gym-image-uploads'
import { cancelGymImageUploads } from '@/lib/manage/gym-image-upload-manager'

/** Global upload progress — survives navigation away from the gym edit page. */
export function GymImageUploadToastHost() {
  const { summary } = useGymImageUploads()

  return (
    <GymImageUploadToast
      active={summary.active}
      completed={summary.completed}
      failed={summary.failed}
      total={summary.total}
      onCancel={cancelGymImageUploads}
    />
  )
}
