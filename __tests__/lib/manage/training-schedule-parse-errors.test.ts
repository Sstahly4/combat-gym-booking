import { describe, expect, it } from 'vitest'
import {
  TrainingScheduleParseError,
  classifyUpstreamOpenAiError,
  formatParseScheduleErrorResponse,
  OWNER_SCHEDULE_PARSE_UNAVAILABLE,
} from '@/lib/manage/training-schedule-parse-errors'

describe('classifyUpstreamOpenAiError', () => {
  it('maps quota and billing errors to a generic owner message', () => {
    const result = classifyUpstreamOpenAiError({
      httpStatus: 429,
      message: 'You exceeded your current quota, please check your plan and billing details.',
      providerCode: 'insufficient_quota',
    })

    expect(result.ownerMessage).toBe(OWNER_SCHEDULE_PARSE_UNAVAILABLE)
    expect(result.code).toBe('provider_unavailable')
    expect(result.httpStatus).toBe(503)
    expect(result.detail).toContain('quota')
  })

  it('maps provider rate limits without exposing billing copy', () => {
    const result = classifyUpstreamOpenAiError({
      httpStatus: 429,
      message: 'Rate limit reached for requests',
      providerCode: 'rate_limit_exceeded',
    })

    expect(result.ownerMessage).toContain('Too many schedule imports')
    expect(result.detail).toContain('Rate limit')
  })
})

describe('formatParseScheduleErrorResponse', () => {
  it('hides provider details from gym owners', () => {
    const error = new TrainingScheduleParseError({
      code: 'provider_unavailable',
      ownerMessage: OWNER_SCHEDULE_PARSE_UNAVAILABLE,
      detail: 'You exceeded your current quota, please check billing.',
      httpStatus: 503,
    })

    const owner = formatParseScheduleErrorResponse(error, false)
    expect(owner.error).toBe(OWNER_SCHEDULE_PARSE_UNAVAILABLE)
    expect(owner.detail).toBeUndefined()

    const admin = formatParseScheduleErrorResponse(error, true)
    expect(admin.error).toContain('vision provider')
    expect(admin.detail).toContain('quota')
  })
})
