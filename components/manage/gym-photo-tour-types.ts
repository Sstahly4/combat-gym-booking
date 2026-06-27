import type { GymImage } from '@/lib/types/database'
import type { GymImageUploadEntry } from '@/lib/manage/gym-image-upload-manager'

export type GymPhotoTourDisplayItem =
  | { kind: 'saved'; key: string; index: number; image: GymImage }
  | {
      kind: 'pending'
      key: string
      index: number
      pending: GymImageUploadEntry
    }
  | { kind: 'transition'; key: string; index: number; previewUrl: string }
