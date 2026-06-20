'use client'

import { useCallback, useSyncExternalStore } from 'react'
import {
  getGymImageUploadSummary,
  getGymImageUploads,
  subscribeGymImageUploads,
  type GymImageUploadEntry,
  type GymImageUploadSummary,
} from '@/lib/manage/gym-image-upload-manager'

const EMPTY_SUMMARY: GymImageUploadSummary = {
  active: false,
  completed: 0,
  failed: 0,
  total: 0,
}

const EMPTY_UPLOADS: GymImageUploadEntry[] = []

export function useGymImageUploads(gymId?: string) {
  const getSummary = useCallback(() => getGymImageUploadSummary(), [])
  const getUploads = useCallback(
    () => (gymId ? getGymImageUploads(gymId) : EMPTY_UPLOADS),
    [gymId],
  )

  const summary = useSyncExternalStore(subscribeGymImageUploads, getSummary, () => EMPTY_SUMMARY)

  const uploads = useSyncExternalStore(subscribeGymImageUploads, getUploads, () => EMPTY_UPLOADS)

  return { summary, uploads }
}
