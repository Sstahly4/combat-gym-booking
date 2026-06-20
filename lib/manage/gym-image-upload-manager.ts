import { createClient } from '@/lib/supabase/client'
import { uploadGymImageWithVariants } from '@/lib/images/gym-image-variants'
import type { GymImage } from '@/lib/types/database'

export const GYM_IMAGE_UPLOAD_CONCURRENCY = 3

export type GymImageUploadStatus = 'queued' | 'uploading' | 'saving' | 'failed' | 'cancelled'

export type GymImageUploadEntry = {
  id: string
  gymId: string
  file: File
  previewUrl: string
  order: number
  status: GymImageUploadStatus
  error?: string | null
}

export type GalleryOrderSnapshotItem =
  | { kind: 'saved'; imageId: string }
  | { kind: 'pending'; pendingId: string }

export type GymImageUploadSummary = {
  active: boolean
  completed: number
  failed: number
  total: number
}

type UploadCompleteListener = (payload: {
  gymId: string
  pendingId: string
  image: GymImage
}) => void

const entries = new Map<string, GymImageUploadEntry>()
const galleryOrderByGym = new Map<string, GalleryOrderSnapshotItem[]>()
const committedGalleryOrderByGym = new Map<string, GalleryOrderSnapshotItem[]>()
const pendingToImageId = new Map<string, string>()
const listeners = new Set<() => void>()
const completeListeners = new Set<UploadCompleteListener>()

let summary: GymImageUploadSummary = { active: false, completed: 0, failed: 0, total: 0 }
let pumpRunning = false
let cancelRequested = false
let sessionCompleted = 0

/** useSyncExternalStore requires referentially stable snapshots between notifications. */
const EMPTY_UPLOADS_SNAPSHOT: GymImageUploadEntry[] = []
const uploadsSnapshotCache = new Map<string, GymImageUploadEntry[]>()

function buildUploadsSnapshot(gymId: string): GymImageUploadEntry[] {
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

function recomputeSummary() {
  const inFlight = [...entries.values()].filter((e) =>
    ['queued', 'uploading', 'saving'].includes(e.status),
  ).length
  const failedInQueue = [...entries.values()].filter((e) => e.status === 'failed').length

  summary = {
    active: inFlight > 0,
    completed: sessionCompleted,
    failed: failedInQueue,
    total: sessionCompleted + failedInQueue + inFlight,
  }
}

function orderForPending(gymId: string, pendingId: string): number {
  const snapshot =
    committedGalleryOrderByGym.get(gymId) ?? galleryOrderByGym.get(gymId) ?? []
  const idx = snapshot.findIndex(
    (item) => item.kind === 'pending' && item.pendingId === pendingId,
  )
  return idx >= 0 ? idx : snapshot.length
}

function syncEntryOrdersFromGallery(gymId: string, order: GalleryOrderSnapshotItem[]) {
  order.forEach((item, index) => {
    if (item.kind !== 'pending') return
    const entry = entries.get(item.pendingId)
    if (entry && entry.gymId === gymId) entry.order = index
  })
}

async function persistGalleryOrder(gymId: string, snapshot: GalleryOrderSnapshotItem[]) {
  const supabase = createClient()
  const updates: Array<{ id: string; order: number }> = []

  snapshot.forEach((item, index) => {
    if (item.kind === 'saved') {
      updates.push({ id: item.imageId, order: index })
      return
    }
    const imageId = pendingToImageId.get(item.pendingId)
    if (imageId) updates.push({ id: imageId, order: index })
  })

  if (updates.length === 0) return

  await Promise.allSettled(
    updates.map(({ id, order }) =>
      supabase.from('gym_images').update({ order }).eq('id', id),
    ),
  )
}

async function maybeReconcileGalleryOrder(gymId: string) {
  const hasActive = [...entries.values()].some(
    (e) => e.gymId === gymId && ['queued', 'uploading', 'saving'].includes(e.status),
  )
  if (hasActive) return

  const snapshot = committedGalleryOrderByGym.get(gymId)
  if (!snapshot) return

  await persistGalleryOrder(gymId, snapshot)
  committedGalleryOrderByGym.delete(gymId)
  fetch(`/api/gyms/${gymId}/revalidate`, { method: 'POST' }).catch(() => {})
}

async function uploadOne(entry: GymImageUploadEntry): Promise<void> {
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
  const order = orderForPending(entry.gymId, entry.id)
  entry.order = order
  const stem = `${Date.now()}-${order}-${Math.random().toString(36).slice(2, 10)}`

  try {
    const uploaded = await uploadGymImageWithVariants({
      supabase,
      gymId: entry.gymId,
      file: entry.file,
      stem,
    })

    if (cancelRequested || !entries.has(entry.id)) {
      await supabase.storage.from('gym-images').remove(uploaded.storagePaths).catch(() => {})
      if (entries.has(entry.id)) entry.status = 'cancelled'
      notify()
      return
    }

    entry.status = 'saving'
    notify()

    const { data: insertedImage, error: insertError } = await supabase
      .from('gym_images')
      .insert({
        gym_id: entry.gymId,
        url: uploaded.url,
        variants: uploaded.variants,
        order,
      })
      .select()
      .single()

    if (insertError) {
      await supabase.storage.from('gym-images').remove(uploaded.storagePaths).catch(() => {})
      throw new Error(insertError.message || 'Failed to save image record')
    }

    if (!insertedImage) throw new Error('Failed to save image record')

    pendingToImageId.set(entry.id, insertedImage.id)

    completeListeners.forEach((fn) =>
      fn({ gymId: entry.gymId, pendingId: entry.id, image: insertedImage as GymImage }),
    )

    entries.delete(entry.id)
    sessionCompleted += 1
    recomputeSummary()
    notify()

    const snapshot = committedGalleryOrderByGym.get(entry.gymId)
    if (snapshot) {
      void persistGalleryOrder(entry.gymId, snapshot)
    }

    void maybeReconcileGalleryOrder(entry.gymId)
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

      const batch = pending.slice(0, GYM_IMAGE_UPLOAD_CONCURRENCY)
      await Promise.all(batch.map((entry) => uploadOne(entry)))
    }
  } finally {
    pumpRunning = false
    const stillUploading = [...entries.values()].some((e) =>
      ['queued', 'uploading', 'saving'].includes(e.status),
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

export function subscribeGymImageUploads(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function subscribeGymImageUploadComplete(listener: UploadCompleteListener) {
  completeListeners.add(listener)
  return () => {
    completeListeners.delete(listener)
  }
}

export function getGymImageUploadSummary(): GymImageUploadSummary {
  return summary
}

export function getGymImageUploads(gymId: string): GymImageUploadEntry[] {
  const cached = uploadsSnapshotCache.get(gymId)
  if (cached) return cached
  const snapshot = buildUploadsSnapshot(gymId)
  if (snapshot !== EMPTY_UPLOADS_SNAPSHOT) {
    uploadsSnapshotCache.set(gymId, snapshot)
  }
  return snapshot
}

export function buildGalleryOrderWithPendingUploads(
  gymId: string,
  saved: GalleryOrderSnapshotItem[],
): GalleryOrderSnapshotItem[] {
  const pendingIds = new Set(
    saved
      .filter((item): item is { kind: 'pending'; pendingId: string } => item.kind === 'pending')
      .map((item) => item.pendingId),
  )

  const merged: GalleryOrderSnapshotItem[] = [...saved]
  for (const entry of entries.values()) {
    if (entry.gymId !== gymId || pendingIds.has(entry.id)) continue
    merged.push({ kind: 'pending', pendingId: entry.id })
    pendingIds.add(entry.id)
  }
  return merged
}

export function hasActiveGymImageUploads(gymId?: string): boolean {
  const list = gymId ? getGymImageUploads(gymId) : [...entries.values()]
  return list.some((e) => ['queued', 'uploading', 'saving'].includes(e.status))
}

export function setGalleryOrderForGym(gymId: string, order: GalleryOrderSnapshotItem[]) {
  galleryOrderByGym.set(gymId, order)
  syncEntryOrdersFromGallery(gymId, order)
}

export function enqueueGymImageUploads(
  gymId: string,
  files: File[],
  startOrder: number,
): GymImageUploadEntry[] {
  const added = files.map((file, idx) => {
    const id = `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 10)}`
    const entry: GymImageUploadEntry = {
      id,
      gymId,
      file,
      previewUrl: URL.createObjectURL(file),
      order: startOrder + idx,
      status: 'queued',
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

export function removeGymImageUpload(pendingId: string) {
  const entry = entries.get(pendingId)
  if (!entry) return
  URL.revokeObjectURL(entry.previewUrl)
  entries.delete(pendingId)
  recomputeSummary()
  notify()
}

export function retryFailedGymImageUploads(gymId: string) {
  let changed = false
  for (const entry of entries.values()) {
    if (entry.gymId !== gymId || entry.status !== 'failed') continue
    entry.status = 'queued'
    entry.error = null
    changed = true
  }
  if (changed) {
    recomputeSummary()
    notify()
    void runPump()
  }
}

export function cancelGymImageUploads() {
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

/** Persist gallery order for saved images now; pending images follow this snapshot when they finish. */
export async function commitGalleryOrderOnSave(
  gymId: string,
  order: GalleryOrderSnapshotItem[],
) {
  committedGalleryOrderByGym.set(gymId, order)
  galleryOrderByGym.set(gymId, order)
  syncEntryOrdersFromGallery(gymId, order)
  await persistGalleryOrder(gymId, order)
}
