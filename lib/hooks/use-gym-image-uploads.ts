'use client'

import { useSyncExternalStore } from 'react'
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

function getUploadsSnapshot(gymId?: string): GymImageUploadEntry[] {
  return gymId ? getGymImageUploads(gymId) : []
}

export function useGymImageUploads(gymId?: string) {
  const summary = useSyncExternalStore(
    subscribeGymImageUploads,
    getGymImageUploadSummary,
    () => EMPTY_SUMMARY,
  )

  const uploads = useSyncExternalStore(
    subscribeGymImageUploads,
    () => getUploadsSnapshot(gymId),
    () => [],
  )

  return { summary, uploads }
}
