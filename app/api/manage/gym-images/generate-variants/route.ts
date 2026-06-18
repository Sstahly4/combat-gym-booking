export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getOwnerOrAdminAccessContext } from '@/lib/auth/owner-guard'
import { createAdminClient } from '@/lib/supabase/admin'
import type { GymImageVariants } from '@/lib/types/database'
import {
  GYM_IMAGE_BUCKET,
  generateGymImageThumbhash,
  generateGymImageVariantBuffers,
  isGymImageWidthKey,
  mergeVariantUrls,
  sanitizeOriginalGymImage,
  variantStoragePath,
} from '@/lib/images/generate-gym-image-variants-sharp'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isSafeStoragePath(path: string, gymId: string): boolean {
  if (!path.startsWith(`${gymId}/`)) return false
  if (path.includes('..')) return false
  return true
}

/**
 * Server-side gym image processing: strip EXIF/GPS from the original, emit WebP
 * variants, and generate a ThumbHash placeholder for instant LQIP.
 */
export async function POST(request: NextRequest) {
  const access = await getOwnerOrAdminAccessContext()
  if (access.status === 'no_user') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (access.status !== 'ok') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { gym_id?: unknown; original_path?: unknown; stem?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const gymId = typeof body.gym_id === 'string' ? body.gym_id.trim() : ''
  const originalPath = typeof body.original_path === 'string' ? body.original_path.trim() : ''
  const stem = typeof body.stem === 'string' ? body.stem.trim() : ''

  if (!gymId || !UUID_RE.test(gymId)) {
    return NextResponse.json({ error: 'gym_id must be a UUID' }, { status: 400 })
  }
  if (!originalPath || !stem) {
    return NextResponse.json({ error: 'original_path and stem are required' }, { status: 400 })
  }
  if (!isSafeStoragePath(originalPath, gymId)) {
    return NextResponse.json({ error: 'Invalid original_path' }, { status: 400 })
  }

  const { data: gym, error: gymError } = await access.supabase
    .from('gyms')
    .select('id, owner_id')
    .eq('id', gymId)
    .maybeSingle()

  if (gymError) {
    return NextResponse.json({ error: gymError.message }, { status: 500 })
  }
  if (!gym) {
    return NextResponse.json({ error: 'Gym not found' }, { status: 404 })
  }

  const isAdmin = access.profile?.role === 'admin'
  if (!isAdmin && gym.owner_id !== access.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const bucket = admin.storage.from(GYM_IMAGE_BUCKET)

  const { data: downloadData, error: downloadError } = await bucket.download(originalPath)
  if (downloadError || !downloadData) {
    return NextResponse.json(
      { error: downloadError?.message || 'Could not download original image' },
      { status: 404 },
    )
  }

  const originalBuffer = Buffer.from(await downloadData.arrayBuffer())
  if (originalBuffer.length === 0) {
    return NextResponse.json({ error: 'Original image is empty' }, { status: 400 })
  }

  let thumbhash: string
  let variantBuffers: Partial<Record<'w400' | 'w800' | 'w1200', Buffer>>
  let sanitized: Awaited<ReturnType<typeof sanitizeOriginalGymImage>>

  try {
    ;[thumbhash, variantBuffers, sanitized] = await Promise.all([
      generateGymImageThumbhash(originalBuffer),
      generateGymImageVariantBuffers(originalBuffer),
      sanitizeOriginalGymImage(originalBuffer, gymId, stem, originalPath),
    ])
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image processing failed'
    return NextResponse.json({ error: message }, { status: 422 })
  }

  const storagePaths: string[] = []
  const widthUrls: Partial<Record<'w400' | 'w800' | 'w1200', string>> = {}

  const sanitizedPath = sanitized.storagePath ?? originalPath
  const { error: sanitizeUploadError } = await bucket.upload(sanitizedPath, sanitized.buffer, {
    cacheControl: '31536000',
    contentType: sanitized.contentType,
    upsert: true,
  })
  if (sanitizeUploadError) {
    return NextResponse.json({ error: sanitizeUploadError.message }, { status: 500 })
  }
  storagePaths.push(sanitizedPath)

  if (sanitized.storagePath && sanitized.storagePath !== originalPath) {
    await bucket.remove([originalPath])
  }

  const publicUrl = bucket.getPublicUrl(sanitizedPath).data.publicUrl

  const slash = originalPath.lastIndexOf('/')
  const assetBase = slash >= 0 ? originalPath.slice(0, slash) : gymId

  for (const [key, buffer] of Object.entries(variantBuffers)) {
    if (!isGymImageWidthKey(key) || !buffer) continue
    const variantPath = variantStoragePath(assetBase, stem, key)
    const { error: uploadError } = await bucket.upload(variantPath, buffer, {
      cacheControl: '31536000',
      contentType: 'image/webp',
      upsert: true,
    })
    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }
    widthUrls[key] = bucket.getPublicUrl(variantPath).data.publicUrl
    storagePaths.push(variantPath)
  }

  if (!widthUrls.w400) {
    await bucket.remove(storagePaths).catch(() => {})
    return NextResponse.json({ error: 'No w400 variant was generated' }, { status: 422 })
  }

  const variants: GymImageVariants = mergeVariantUrls(null, widthUrls, thumbhash)

  return NextResponse.json({
    url: publicUrl,
    variants,
    storage_paths: storagePaths,
  })
}
