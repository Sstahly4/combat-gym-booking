import { createClient } from '@/lib/supabase/client'

export const TRAINER_PHOTO_UPLOAD_CONCURRENCY = 3

export type TrainerPhotoUploadStatus =
  | 'queued'
  | 'uploading'
  | 'failed'
  | 'cancelled'
  | 'complete'

export type TrainerPhotoUploadEntry = {
  id: string
  gymId: string
  /** Stable client id for the trainer row (survives reorder/remove). */
  trainerSlotKey: string
  file: File
  previewUrl: string
  status: TrainerPhotoUploadStatus
  publicUrl: string | null
  error?: string | null
}

export type TrainerPhotoUploadSummary = {
  active: boolean
  completed: number
  failed: number
  total: number
}

export type TrainerPhotoCommitSlot = {
  clientKey: string
  name: string
  discipline: string
  experience: string
  description: string | null
  photo:
    | { kind: 'saved'; url: string }
    | { kind: 'pending'; uploadId: string }
    | { kind: 'none' }
}

type CommittedTrainerPhotos = {
  gymId: string
  trainers: TrainerPhotoCommitSlot[]
}

const entries = new Map<string, TrainerPhotoUploadEntry>()
const listeners = new Set<() => void>()
const committedByGym = new Map<string, CommittedTrainerPhotos>()

let summary: TrainerPhotoUploadSummary = {
  active: false,
  completed: 0,
  failed: 0,
  total: 0,
}
let pumpRunning = false
let cancelRequested = false
let sessionCompleted = 0

const EMPTY_UPLOADS_SNAPSHOT: TrainerPhotoUploadEntry[] = []
const uploadsSnapshotCache = new Map<string, TrainerPhotoUploadEntry[]>()

function buildUploadsSnapshot(gymId: string): TrainerPhotoUploadEntry[] {
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

function resolvePhotoUrl(slot: TrainerPhotoCommitSlot['photo']): string | null {
  if (slot.kind === 'saved') return slot.url.trim() || null
  if (slot.kind === 'none') return null
  const entry = entries.get(slot.uploadId)
  if (entry?.status === 'complete' && entry.publicUrl) return entry.publicUrl
  return null
}

function buildPersistedTrainers(commit: CommittedTrainerPhotos) {
  return commit.trainers
    .map((t) => ({
      name: t.name,
      discipline: t.discipline,
      experience: t.experience,
      photo_url: resolvePhotoUrl(t.photo),
      description: t.description,
    }))
    .filter((t) => t.name && t.discipline)
}

async function persistCommittedTrainerPhotos(gymId: string) {
  const commit = committedByGym.get(gymId)
  if (!commit) return

  const hasPending = commit.trainers.some(
    (t) => t.photo.kind === 'pending' && entries.get(t.photo.uploadId)?.status !== 'complete',
  )
  const hasFailed = commit.trainers.some(
    (t) =>
      t.photo.kind === 'pending' && entries.get(t.photo.uploadId)?.status === 'failed',
  )
  if (hasFailed) return

  const supabase = createClient()
  const { error } = await supabase
    .from('gyms')
    .update({ trainers: buildPersistedTrainers(commit) })
    .eq('id', gymId)

  if (error) {
    console.error('[trainer-photos] persist failed', error)
    return
  }

  if (!hasPending) {
    for (const slot of commit.trainers) {
      if (slot.photo.kind !== 'pending') continue
      const entry = entries.get(slot.photo.uploadId)
      if (entry?.status === 'complete') {
        URL.revokeObjectURL(entry.previewUrl)
        entries.delete(slot.photo.uploadId)
      }
    }
    committedByGym.delete(gymId)
    recomputeSummary()
    notify()
    fetch(`/api/gyms/${gymId}/revalidate`, { method: 'POST' }).catch(() => {})
  }
}

function reconcileCommittedForUpload(uploadId: string) {
  for (const gymId of committedByGym.keys()) {
    const commit = committedByGym.get(gymId)
    if (
      !commit?.trainers.some(
        (t) => t.photo.kind === 'pending' && t.photo.uploadId === uploadId,
      )
    ) {
      continue
    }
    void persistCommittedTrainerPhotos(gymId)
  }
}

/** Resolve trainer rows for immediate gym save (prefix persist for in-flight photos). */
export function resolveTrainerRowsForSave(
  trainers: TrainerPhotoCommitSlot[],
): { rows: Array<{
  name: string
  discipline: string
  experience: string
  photo_url: string | null
  description: string | null
}>; hasPending: boolean; failed: boolean } {
  let hasPending = false
  let failed = false
  const rows = trainers.map((t) => {
    if (t.photo.kind === 'pending') {
      const entry = entries.get(t.photo.uploadId)
      if (entry?.status === 'complete' && entry.publicUrl) {
        return {
          name: t.name,
          discipline: t.discipline,
          experience: t.experience,
          photo_url: entry.publicUrl,
          description: t.description,
        }
      }
      if (entry?.status === 'failed') {
        failed = true
      }
      if (entry && ['queued', 'uploading'].includes(entry.status)) {
        hasPending = true
      }
      return {
        name: t.name,
        discipline: t.discipline,
        experience: t.experience,
        photo_url: null,
        description: t.description,
      }
    }
    return {
      name: t.name,
      discipline: t.discipline,
      experience: t.experience,
      photo_url: t.photo.kind === 'saved' ? t.photo.url || null : null,
      description: t.description,
    }
  })
  return { rows, hasPending, failed }
}

export function commitTrainerPhotosOnSave(gymId: string, trainers: TrainerPhotoCommitSlot[]) {
  committedByGym.set(gymId, { gymId, trainers })
  void persistCommittedTrainerPhotos(gymId)
}

async function uploadOne(entry: TrainerPhotoUploadEntry): Promise<void> {
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
  const ext = entry.file.name.split('.').pop() || 'jpg'
  const safeExt = ext.length <= 10 ? ext : 'jpg'
  const fileName = `trainers/${entry.gymId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExt}`

  try {
    const { error: uploadError } = await supabase.storage
      .from('gym-images')
      .upload(fileName, entry.file, { cacheControl: '3600', upsert: false })

    if (cancelRequested || !entries.has(entry.id)) {
      if (entries.has(entry.id)) entry.status = 'cancelled'
      notify()
      return
    }

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from('gym-images').getPublicUrl(fileName)
    entry.publicUrl = urlData.publicUrl
    entry.status = 'complete'
    sessionCompleted += 1
    recomputeSummary()
    notify()
    reconcileCommittedForUpload(entry.id)
  } catch (e: unknown) {
    entry.status = 'failed'
    entry.error = e instanceof Error ? e.message : String(e) || 'Upload failed'
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

      const batch = pending.slice(0, TRAINER_PHOTO_UPLOAD_CONCURRENCY)
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

export function subscribeTrainerPhotoUploads(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getTrainerPhotoUploadSummary(): TrainerPhotoUploadSummary {
  return summary
}

export function getTrainerPhotoUploads(gymId: string): TrainerPhotoUploadEntry[] {
  const cached = uploadsSnapshotCache.get(gymId)
  if (cached) return cached
  const snapshot = buildUploadsSnapshot(gymId)
  if (snapshot !== EMPTY_UPLOADS_SNAPSHOT) {
    uploadsSnapshotCache.set(gymId, snapshot)
  }
  return snapshot
}

export function getTrainerPhotoUpload(id: string): TrainerPhotoUploadEntry | undefined {
  const entry = entries.get(id)
  return entry ? { ...entry } : undefined
}

export function enqueueTrainerPhotoUpload(
  gymId: string,
  trainerSlotKey: string,
  file: File,
): TrainerPhotoUploadEntry {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const entry: TrainerPhotoUploadEntry = {
    id,
    gymId,
    trainerSlotKey,
    file,
    previewUrl: URL.createObjectURL(file),
    status: 'queued',
    publicUrl: null,
    error: null,
  }
  entries.set(id, entry)
  recomputeSummary()
  notify()
  void runPump()
  return entry
}

export function removeTrainerPhotoUpload(id: string) {
  const entry = entries.get(id)
  if (!entry) return
  URL.revokeObjectURL(entry.previewUrl)
  entries.delete(id)
  recomputeSummary()
  notify()
}

export function cancelTrainerPhotoUploads() {
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
