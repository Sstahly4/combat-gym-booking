'use client'

import { useCallback, useSyncExternalStore } from 'react'
import {
  getTrainerPhotoUploadSummary,
  getTrainerPhotoUploads,
  subscribeTrainerPhotoUploads,
  type TrainerPhotoUploadEntry,
  type TrainerPhotoUploadSummary,
} from '@/lib/manage/trainer-photo-upload-manager'

const EMPTY_SUMMARY: TrainerPhotoUploadSummary = {
  active: false,
  completed: 0,
  failed: 0,
  total: 0,
}

const EMPTY_UPLOADS: TrainerPhotoUploadEntry[] = []

export function useTrainerPhotoUploads(gymId?: string) {
  const getSummary = useCallback(() => getTrainerPhotoUploadSummary(), [])
  const getUploads = useCallback(
    () => (gymId ? getTrainerPhotoUploads(gymId) : EMPTY_UPLOADS),
    [gymId],
  )

  const summary = useSyncExternalStore(
    subscribeTrainerPhotoUploads,
    getSummary,
    () => EMPTY_SUMMARY,
  )

  const uploads = useSyncExternalStore(
    subscribeTrainerPhotoUploads,
    getUploads,
    () => EMPTY_UPLOADS,
  )

  return { summary, uploads }
}
