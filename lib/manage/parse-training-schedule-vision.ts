import 'server-only'

import {
  buildTrainingScheduleFromParsedRows,
  TRAINING_SCHEDULE_DAYS,
  type ParsedScheduleRow,
  type ParsedScheduleVisionResult,
  type TrainingSchedule,
} from '@/lib/manage/training-schedule'
import {
  TrainingScheduleParseError,
  classifyUpstreamOpenAiError,
  OWNER_SCHEDULE_PARSE_UNAVAILABLE,
} from '@/lib/manage/training-schedule-parse-errors'

export { TrainingScheduleParseError } from '@/lib/manage/training-schedule-parse-errors'

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions'
const PARSE_MODEL = process.env.TRAINING_SCHEDULE_PARSE_MODEL ?? 'gpt-4o-mini'

function readOpenAiApiKey(): string | null {
  const raw =
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.OPENAI_KEY?.trim() ||
    null
  if (!raw) return null
  return raw.replace(/^["']|["']$/g, '')
}

const SYSTEM_PROMPT = `You extract weekly gym class timetables from photos or screenshots.
Return ONLY valid JSON with this exact shape:
{
  "sessions": [
    { "day": "monday", "time": "06:00-08:00", "type": "Muay Thai" }
  ],
  "warnings": ["optional note about unclear cells"]
}

Rules:
- day must be full lowercase English weekday: monday, tuesday, wednesday, thursday, friday, saturday, sunday
- time is a human-readable slot: single time "09:00" or range "06:00-08:00" (24h preferred, AM/PM ok)
- type is the class name (Muay Thai, BJJ, Sparring, Conditioning, etc.) — omit if blank
- include every class session you can read; skip blank/rest cells
- combat gyms often have split shifts (morning + evening) — include both
- parallel columns (Mat 1 / Mat 2) are separate sessions at the same time if both have classes
- if a day is closed or empty, omit it
- warnings: note illegible areas, guessed times, or partial weeks — keep brief`

function buildUserPrompt(disciplines: string[]): string {
  const hint =
    disciplines.length > 0
      ? `This gym offers: ${disciplines.join(', ')}. Prefer matching class names where visible.`
      : 'Extract all visible class sessions from this timetable image.'
  return `${hint}\n\nReturn JSON only.`
}

type OpenAIChatResponse = {
  choices?: Array<{ message?: { content?: string | null } }>
  error?: { message?: string; type?: string; code?: string }
}

function userFacingParseError(
  ownerMessage: string,
  detail: string,
  code: 'invalid_response' | 'empty_result',
): TrainingScheduleParseError {
  return new TrainingScheduleParseError({
    code,
    ownerMessage,
    detail,
  })
}

function extractJsonContent(content: string): string {
  const trimmed = content.trim()
  const fence = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/im.exec(trimmed)
  if (fence?.[1]) return fence[1].trim()
  return trimmed
}

function rowFromUnknown(day: string, item: unknown): ParsedScheduleRow | null {
  if (!item || typeof item !== 'object') return null
  const row = item as Record<string, unknown>
  const time = String(row.time ?? row.start_time ?? row.start ?? row.slot ?? '').trim()
  if (!time) return null
  const typeRaw = row.type ?? row.class_name ?? row.class ?? row.name ?? row.label
  return {
    day,
    time,
    type: typeRaw != null ? String(typeRaw) : undefined,
  }
}

function normalizeSessionsPayload(parsed: unknown): ParsedScheduleRow[] {
  if (!parsed || typeof parsed !== 'object') return []

  const obj = parsed as Record<string, unknown>

  if (Array.isArray(obj.sessions)) {
    const rows: ParsedScheduleRow[] = []
    for (const item of obj.sessions) {
      if (!item || typeof item !== 'object') continue
      const row = item as Record<string, unknown>
      const day = String(row.day ?? row.day_of_week ?? row.weekday ?? '').trim()
      const time = String(row.time ?? row.start_time ?? row.start ?? '').trim()
      if (!day || !time) continue
      const typeRaw = row.type ?? row.class_name ?? row.class ?? row.name
      rows.push({
        day,
        time,
        type: typeRaw != null ? String(typeRaw) : undefined,
      })
    }
    return rows
  }

  const keyed: ParsedScheduleRow[] = []
  for (const day of TRAINING_SCHEDULE_DAYS) {
    const val = obj[day]
    if (!Array.isArray(val)) continue
    for (const item of val) {
      const row = rowFromUnknown(day, item)
      if (row) keyed.push(row)
    }
  }
  if (keyed.length > 0) return keyed

  if (obj.schedule && typeof obj.schedule === 'object') {
    return normalizeSessionsPayload(obj.schedule)
  }
  if (obj.timetable && typeof obj.timetable === 'object') {
    return normalizeSessionsPayload(obj.timetable)
  }

  return []
}

function parseModelJson(content: string): ParsedScheduleVisionResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(extractJsonContent(content))
  } catch {
    throw userFacingParseError(
      'Could not read a timetable from this image.',
      'Model returned invalid JSON while parsing timetable.',
      'invalid_response',
    )
  }

  const sessions = normalizeSessionsPayload(parsed)
  if (sessions.length === 0) {
    throw userFacingParseError(
      'Could not read a timetable from this image.',
      'Model JSON did not include any recognizable sessions.',
      'invalid_response',
    )
  }

  const obj = parsed as { warnings?: unknown }
  const warnings = Array.isArray(obj.warnings)
    ? obj.warnings.filter((w): w is string => typeof w === 'string' && w.trim().length > 0)
    : undefined

  return { sessions, warnings }
}

export async function parseTrainingScheduleImage(params: {
  imageBase64: string
  mimeType: string
  disciplines?: string[]
}): Promise<{
  schedule: TrainingSchedule
  warnings: string[]
  sessionCount: number
  skipped: number
}> {
  const apiKey = readOpenAiApiKey()
  if (!apiKey) {
    throw new TrainingScheduleParseError({
      code: 'missing_api_key',
      ownerMessage: OWNER_SCHEDULE_PARSE_UNAVAILABLE,
      detail: 'Schedule import is not configured (missing OPENAI_API_KEY).',
      httpStatus: 503,
    })
  }

  const disciplines = params.disciplines?.filter(Boolean) ?? []
  const dataUrl = `data:${params.mimeType};base64,${params.imageBase64}`

  let response: Response
  try {
    response = await fetch(OPENAI_CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: PARSE_MODEL,
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 4096,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: buildUserPrompt(disciplines) },
              { type: 'image_url', image_url: { url: dataUrl, detail: 'auto' } },
            ],
          },
        ],
      }),
    })
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : 'Network error calling OpenAI'
    throw new TrainingScheduleParseError({
      code: 'upstream',
      ownerMessage: OWNER_SCHEDULE_PARSE_UNAVAILABLE,
      detail,
      httpStatus: 502,
    })
  }

  const rawBody = await response.text()
  let payload: OpenAIChatResponse
  try {
    payload = rawBody ? (JSON.parse(rawBody) as OpenAIChatResponse) : {}
  } catch {
    throw new TrainingScheduleParseError({
      code: 'upstream',
      ownerMessage: OWNER_SCHEDULE_PARSE_UNAVAILABLE,
      detail: `Vision API returned an invalid response (${response.status}).`,
      httpStatus: 502,
    })
  }

  if (!response.ok) {
    const msg =
      payload.error?.message || rawBody.slice(0, 500) || `Vision API error (${response.status})`
    const classified = classifyUpstreamOpenAiError({
      httpStatus: response.status,
      message: msg,
      providerCode: payload.error?.code ?? payload.error?.type,
    })
    throw new TrainingScheduleParseError({ ...classified })
  }

  const content = payload.choices?.[0]?.message?.content
  if (!content?.trim()) {
    throw userFacingParseError(
      'Could not read a timetable from this image.',
      'Empty response from vision parser.',
      'invalid_response',
    )
  }

  const parsed = parseModelJson(content)
  const { schedule, skipped, sessionCount } = buildTrainingScheduleFromParsedRows(parsed.sessions)

  if (sessionCount === 0) {
    throw userFacingParseError(
      'No class sessions found. Try a clearer photo or enter times manually.',
      'Parsed timetable contained no mappable class sessions.',
      'empty_result',
    )
  }

  const warnings = [...(parsed.warnings ?? [])]
  if (skipped > 0) {
    warnings.push(`${skipped} row${skipped === 1 ? '' : 's'} could not be mapped and were skipped.`)
  }

  return { schedule, warnings, sessionCount, skipped }
}

export const TRAINING_SCHEDULE_ACCEPTED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

export const TRAINING_SCHEDULE_MAX_BYTES = 10 * 1024 * 1024
