export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Vision parsing can take 20–40s on large timetable photos. */
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { getOwnerOrAdminAccessContext } from '@/lib/auth/owner-guard'
import { prepareScheduleImageForVision } from '@/lib/manage/prepare-schedule-image-for-vision'
import {
  parseTrainingScheduleImage,
  TRAINING_SCHEDULE_ACCEPTED_MIME,
  TRAINING_SCHEDULE_MAX_BYTES,
  TrainingScheduleParseError,
} from '@/lib/manage/parse-training-schedule-vision'
import { checkRateLimit } from '@/lib/rate-limit'

async function assertCanEditGym(
  access: Awaited<ReturnType<typeof getOwnerOrAdminAccessContext>>,
  gymId: string,
) {
  const { data: gym, error } = await access.supabase
    .from('gyms')
    .select('id, owner_id, disciplines')
    .eq('id', gymId)
    .maybeSingle()

  if (error || !gym) return null
  if (access.profile?.role === 'admin') return gym
  if (gym.owner_id === access.userId) return gym
  return null
}

function inferImageMimeType(file: File): string | null {
  const type = file.type?.trim().toLowerCase()
  if (type && TRAINING_SCHEDULE_ACCEPTED_MIME.includes(type as (typeof TRAINING_SCHEDULE_ACCEPTED_MIME)[number])) {
    return type
  }
  const ext = file.name.split('.').pop()?.toLowerCase()
  const byExt: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
  }
  return ext ? byExt[ext] ?? null : null
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const rate = await checkRateLimit(request, 'manage:parse-schedule')
    if (!rate.allowed) return rate.response

    const access = await getOwnerOrAdminAccessContext()
    if (access.status === 'no_user') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (access.status !== 'ok') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const gymId = params.id
    if (!gymId) {
      return NextResponse.json({ error: 'Missing gym id' }, { status: 400 })
    }

    const gym = await assertCanEditGym(access, gymId)
    if (!gym) {
      return NextResponse.json({ error: 'Gym not found or access denied' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Upload an image file (PNG, JPEG, or WebP).' }, { status: 400 })
    }

    if (file.size > TRAINING_SCHEDULE_MAX_BYTES) {
      return NextResponse.json({ error: 'Image must be 10 MB or smaller.' }, { status: 400 })
    }

    const mimeType = inferImageMimeType(file)
    if (!mimeType) {
      return NextResponse.json(
        { error: 'Unsupported file type. Use PNG, JPEG, WebP, or GIF.' },
        { status: 400 },
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let prepared: { base64: string; mimeType: string }
    try {
      prepared = await prepareScheduleImageForVision(buffer)
    } catch (prepError) {
      const message = prepError instanceof Error ? prepError.message : 'Could not read image.'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const disciplines = Array.isArray(gym.disciplines) ? (gym.disciplines as string[]) : []

    const result = await parseTrainingScheduleImage({
      imageBase64: prepared.base64,
      mimeType: prepared.mimeType,
      disciplines,
    })

    return NextResponse.json({
      schedule: result.schedule,
      warnings: result.warnings,
      sessionCount: result.sessionCount,
      skipped: result.skipped,
    })
  } catch (error) {
    if (error instanceof TrainingScheduleParseError) {
      const status =
        error.code === 'missing_api_key'
          ? 503
          : error.code === 'empty_result'
            ? 422
            : error.code === 'upstream'
              ? 502
              : 400
      return NextResponse.json({ error: error.message, code: error.code }, { status })
    }

    console.error('[parse-schedule]', error)
    const message =
      error instanceof Error && error.message.trim()
        ? error.message
        : 'Failed to parse timetable.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
