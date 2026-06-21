'use client'

import { useCallback, useSyncExternalStore } from 'react'
import {
  getAccommodationImageUploadSummary,
  getAccommodationImageUploads,
  subscribeAccommodationImageUploads,
  type AccommodationImageUploadEntry,
  type AccommodationImageUploadSummary,
} from '@/lib/manage/accommodation-image-upload-manager'

const EMPTY_SUMMARY: AccommodationImageUploadSummary = {
  active: false,
  completed: 0,
  failed: 0,
  total: 0,
}

const EMPTY_UPLOADS: AccommodationImageUploadEntry[] = []

export function useAccommodationImageUploads(gymId?: string) {
  const getSummary = useCallback(() => getAccommodationImageUploadSummary(), [])
  const getUploads = useCallback(
    () => (gymId ? getAccommodationImageUploads(gymId) : EMPTY_UPLOADS),
    [gymId],
  )

  const summary = useSyncExternalStore(
    subscribeAccommodationImageUploads,
    getSummary,
    () => EMPTY_SUMMARY,
  )

  const uploads = useSyncExternalStore(
    subscribeAccommodationImageUploads,
    getUploads,
    () => EMPTY_UPLOADS,
  )

  return { summary, uploads }
}
