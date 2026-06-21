import { createClient } from '@/lib/supabase/client'
import {
  serializeManagedImageRef,
  uploadGymImageWithVariants,
} from '@/lib/images/gym-image-variants'

export const ACCOMMODATION_IMAGE_UPLOAD_CONCURRENCY = 3

export type AccommodationImageUploadStatus =
  | 'queued'
  | 'uploading'
  | 'failed'
  | 'cancelled'
  | 'complete'

export type AccommodationImageUploadEntry = {
  id: string
  gymId: string
  file: File
  previewUrl: string
  status: AccommodationImageUploadStatus
  serializedRef: string | null
  error?: string | null
}

export type AccommodationImageUploadSummary = {
  active: boolean
  completed: number
  failed: number
  total: number
}

const entries = new Map<string, AccommodationImageUploadEntry>()
const listeners = new Set<() => void>()

export type AccommodationImageOrderItem =
  | { kind: 'saved'; ref: string }
  | { kind: 'pending'; uploadId: string }

type CommittedAccommodationImages = {
  gymId: string
  order: AccommodationImageOrderItem[]
}

const committedImagesByAccommodation = new Map<string, CommittedAccommodationImages>()

let summary: AccommodationImageUploadSummary = {
  active: false,
  completed: 0,
  failed: 0,
  total: 0,
}
let pumpRunning = false
let cancelRequested = false
let sessionCompleted = 0

const EMPTY_UPLOADS_SNAPSHOT: AccommodationImageUploadEntry[] = []
const uploadsSnapshotCache = new Map<string, AccommodationImageUploadEntry[]>()

function buildUploadsSnapshot(gymId: string): AccommodationImageUploadEntry[] {
  const list = [...entries.values()]
    .filter((e) => e.gymId === gymId)
    .map((e) => ({ ...e }))
  return list.length > 0 ? list : EMPTY_UPLOADS_SNAPSHOT
}

function invalidateUploadSnapshots() {
  uploadsSnapshotCache.clear()
}

function notify() {
  invalidateUploadSnapshots()
  listeners.forEach((fn) => fn())
}

/** Resolve ordered image refs; stops at the first in-flight pending slot (prefix persist). */
export function resolveAccommodationImageOrder(order: AccommodationImageOrderItem[]): {
  refs: string[]
  hasPending: boolean
  failed: boolean
} {
  const refs: string[] = []
  let hasPending = false
  let failed = false

  for (const item of order) {
    if (item.kind === 'saved') {
      const ref = item.ref.trim()
      if (ref) refs.push(ref)
      continue
    }

    const entry = entries.get(item.uploadId)
    if (!entry) continue

    if (entry.status === 'complete' && entry.serializedRef) {
      refs.push(entry.serializedRef)
      continue
    }

    if (entry.status === 'failed') {
      failed = true
      break
    }

    if (entry.status === 'queued' || entry.status === 'uploading') {
      hasPending = true
      break
    }
  }

  return { refs, hasPending, failed }
}

async function persistCommittedAccommodationImages(accommodationId: string) {
  const commit = committedImagesByAccommodation.get(accommodationId)
  if (!commit) return

  const { refs, hasPending, failed } = resolveAccommodationImageOrder(commit.order)
  if (failed) return

  const supabase = createClient()
  const { error } = await supabase
    .from('accommodations')
    .update({ images: refs })
    .eq('id', accommodationId)

  if (error) {
    console.error('[accommodation-images] persist failed', error)
    return
  }

  if (!hasPending) {
    for (const item of commit.order) {
      if (item.kind !== 'pending') continue
      const entry = entries.get(item.uploadId)
      if (entry?.status === 'complete') {
        URL.revokeObjectURL(entry.previewUrl)
        entries.delete(item.uploadId)
      }
    }
    committedImagesByAccommodation.delete(accommodationId)
    recomputeSummary()
  }
}

function reconcileCommittedForUpload(uploadId: string) {
  for (const accommodationId of committedImagesByAccommodation.keys()) {
    const commit = committedImagesByAccommodation.get(accommodationId)
    if (!commit?.order.some((item) => item.kind === 'pending' && item.uploadId === uploadId)) {
      continue
    }
    void persistCommittedAccommodationImages(accommodationId)
  }
}

/** Persist image order after save; pending uploads finish in the background via global toast. */
export function commitAccommodationImagesOnSave(
  accommodationId: string,
  gymId: string,
  order: AccommodationImageOrderItem[],
) {
  committedImagesByAccommodation.set(accommodationId, { gymId, order })
  void persistCommittedAccommodationImages(accommodationId)
}

function recomputeSummary() {
  const inFlight = [...entries.values()].filter((e) =>
    ['queued', 'uploading'].includes(e.status),
  ).length
  const failedInQueue = [...entries.values()].filter((e) => e.status === 'failed').length

  summary = {
    active: inFlight > 0,
    completed: sessionCompleted,
    failed: failedInQueue,
    total: sessionCompleted + failedInQueue + inFlight,
  }
}

async function uploadOne(entry: AccommodationImageUploadEntry): Promise<void> {
  if (cancelRequested) {
    entry.status = 'cancelled'
    notify()
    return
  }

  const stillActive = entries.get(entry.id)
  if (!stillActive || stillActive.status === 'cancelled') return

  entry.status = 'uploading'
  entry.error = null
  notify()

  const supabase = createClient()
  const stem = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

  try {
    const uploaded = await uploadGymImageWithVariants({
      supabase,
      gymId: entry.gymId,
      file: entry.file,
      stem,
      subdir: 'accommodations',
    })

    if (cancelRequested || !entries.has(entry.id)) {
      await supabase.storage.from('gym-images').remove(uploaded.storagePaths).catch(() => {})
      if (entries.has(entry.id)) entry.status = 'cancelled'
      notify()
      return
    }

    entry.serializedRef = serializeManagedImageRef(uploaded)
    entry.status = 'complete'
    sessionCompleted += 1
    recomputeSummary()
    notify()
    reconcileCommittedForUpload(entry.id)
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e) || 'Upload failed'
    entry.status = 'failed'
    entry.error = errorMessage
    recomputeSummary()
    notify()
  }
}

async function runPump() {
  if (pumpRunning) return
  pumpRunning = true
  cancelRequested = false

  try {
    while (!cancelRequested) {
      const pending = [...entries.values()].filter(
        (e) => e.status === 'queued' || e.status === 'failed',
      )
      if (pending.length === 0) break

      recomputeSummary()
      notify()

      const batch = pending.slice(0, ACCOMMODATION_IMAGE_UPLOAD_CONCURRENCY)
      await Promise.all(batch.map((entry) => uploadOne(entry)))
    }
  } finally {
    pumpRunning = false
    const stillUploading = [...entries.values()].some((e) =>
      ['queued', 'uploading'].includes(e.status),
    )
    if (!stillUploading) {
      summary = { active: false, completed: 0, failed: 0, total: 0 }
      sessionCompleted = 0
      notify()
    } else if (!cancelRequested) {
      void runPump()
    }
  }
}

export function subscribeAccommodationImageUploads(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getAccommodationImageUploadSummary(): AccommodationImageUploadSummary {
  return summary
}

export function getAccommodationImageUploads(gymId: string): AccommodationImageUploadEntry[] {
  const cached = uploadsSnapshotCache.get(gymId)
  if (cached) return cached
  const snapshot = buildUploadsSnapshot(gymId)
  if (snapshot !== EMPTY_UPLOADS_SNAPSHOT) {
    uploadsSnapshotCache.set(gymId, snapshot)
  }
  return snapshot
}

export function getAccommodationImageUpload(id: string): AccommodationImageUploadEntry | undefined {
  const entry = entries.get(id)
  return entry ? { ...entry } : undefined
}

export function enqueueAccommodationImageUploads(
  gymId: string,
  files: File[],
): AccommodationImageUploadEntry[] {
  const added = files.map((file) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    const entry: AccommodationImageUploadEntry = {
      id,
      gymId,
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'queued',
      serializedRef: null,
      error: null,
    }
    entries.set(id, entry)
    return entry
  })

  recomputeSummary()
  notify()
  void runPump()
  return added
}

export function removeAccommodationImageUpload(id: string) {
  const entry = entries.get(id)
  if (!entry) return
  URL.revokeObjectURL(entry.previewUrl)
  entries.delete(id)
  recomputeSummary()
  notify()
}

export function cancelAccommodationImageUploads() {
  cancelRequested = true
  for (const entry of entries.values()) {
    if (['queued', 'failed'].includes(entry.status)) {
      URL.revokeObjectURL(entry.previewUrl)
      entries.delete(entry.id)
    }
  }
  recomputeSummary()
  notify()
}

/** Wait until listed uploads finish (complete or failed). */
export function waitForAccommodationImageUploads(ids: string[]): Promise<void> {
  const unique = [...new Set(ids)]
  if (unique.length === 0) return Promise.resolve()

  return new Promise((resolve) => {
    const check = () => {
      const allDone = unique.every((id) => {
        const entry = entries.get(id)
        if (!entry) return true
        return entry.status === 'complete' || entry.status === 'failed' || entry.status === 'cancelled'
      })
      if (allDone) {
        unsub()
        resolve()
      }
    }

    const unsub = subscribeAccommodationImageUploads(check)
    check()
  })
}

export function resolveAccommodationImageRefs(uploadIds: string[]): string[] {
  return uploadIds.map((id) => {
    const entry = entries.get(id)
    if (!entry?.serializedRef) {
      throw new Error(entry?.error || 'Image upload did not finish')
    }
    return entry.serializedRef
  })
}

/** Remove completed uploads from the queue after they are persisted on the accommodation row. */
export function clearCompletedAccommodationImageUploads(ids: string[]) {
  let changed = false
  for (const id of ids) {
    const entry = entries.get(id)
    if (entry?.status === 'complete') {
      URL.revokeObjectURL(entry.previewUrl)
      entries.delete(id)
      changed = true
    }
  }
  if (changed) {
    recomputeSummary()
    notify()
  }
}
