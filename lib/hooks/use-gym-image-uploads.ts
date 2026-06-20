'use client'

import { useEffect, useState } from 'react'
import {
  getGymImageUploadSummary,
  getGymImageUploads,
  subscribeGymImageUploads,
  type GymImageUploadEntry,
  type GymImageUploadSummary,
} from '@/lib/manage/gym-image-upload-manager'

export function useGymImageUploads(gymId?: string) {
  const [summary, setSummary] = useState<GymImageUploadSummary>(() => getGymImageUploadSummary())
  const [uploads, setUploads] = useState<GymImageUploadEntry[]>(() =>
    gymId ? getGymImageUploads(gymId) : [],
  )

  useEffect(() => {
    const sync = () => {
      setSummary(getGymImageUploadSummary())
      if (gymId) setUploads(getGymImageUploads(gymId))
    }
    sync()
    return subscribeGymImageUploads(sync)
  }, [gymId])

  return { summary, uploads }
}
