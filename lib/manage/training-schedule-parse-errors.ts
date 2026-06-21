export type TrainingScheduleParseErrorCode =
  | 'missing_api_key'
  | 'provider_unavailable'
  | 'upstream'
  | 'invalid_response'
  | 'empty_result'

/** Shown to gym owners when the vision provider is down, misconfigured, or out of capacity. */
export const OWNER_SCHEDULE_PARSE_UNAVAILABLE =
  'Schedule auto-fill is temporarily unavailable. Enter your class times manually below, or try again later.'

export const OWNER_SCHEDULE_PARSE_RATE_LIMITED =
  'Too many schedule imports right now. Please wait a few minutes and try again.'

export type ParsedScheduleErrorResponse = {
  error: string
  code: TrainingScheduleParseErrorCode
  detail?: string
}

export class TrainingScheduleParseError extends Error {
  readonly code: TrainingScheduleParseErrorCode
  readonly ownerMessage: string
  readonly detail: string
  readonly httpStatus: number

  constructor(params: {
    code: TrainingScheduleParseErrorCode
    ownerMessage: string
    detail: string
    httpStatus?: number
  }) {
    super(params.detail)
    this.name = 'TrainingScheduleParseError'
    this.code = params.code
    this.ownerMessage = params.ownerMessage
    this.detail = params.detail
    this.httpStatus = params.httpStatus ?? defaultHttpStatus(params.code)
  }
}

function defaultHttpStatus(code: TrainingScheduleParseErrorCode): number {
  switch (code) {
    case 'missing_api_key':
    case 'provider_unavailable':
      return 503
    case 'upstream':
      return 502
    case 'empty_result':
      return 422
    case 'invalid_response':
    default:
      return 400
  }
}

function isProviderCapacityOrBilling(message: string, providerCode?: string): boolean {
  const m = message.toLowerCase()
  const c = (providerCode ?? '').toLowerCase()
  return (
    c.includes('insufficient_quota') ||
    c.includes('billing') ||
    c.includes('billing_hard_limit') ||
    m.includes('quota') ||
    m.includes('billing') ||
    m.includes('exceeded your current quota') ||
    m.includes('insufficient credits') ||
    m.includes('payment required') ||
    m.includes('insufficient funds')
  )
}

function isProviderRateLimited(message: string, httpStatus: number, providerCode?: string): boolean {
  const c = (providerCode ?? '').toLowerCase()
  const m = message.toLowerCase()
  if (isProviderCapacityOrBilling(message, providerCode)) return false
  return httpStatus === 429 || c.includes('rate_limit') || m.includes('rate limit')
}

export function classifyUpstreamOpenAiError(params: {
  httpStatus: number
  message: string
  providerCode?: string
}): Pick<
  TrainingScheduleParseError,
  'code' | 'ownerMessage' | 'detail' | 'httpStatus'
> {
  const detail = params.message.trim() || `Vision API error (${params.httpStatus})`

  if (isProviderCapacityOrBilling(detail, params.providerCode)) {
    return {
      code: 'provider_unavailable',
      ownerMessage: OWNER_SCHEDULE_PARSE_UNAVAILABLE,
      detail,
      httpStatus: 503,
    }
  }

  if (isProviderRateLimited(detail, params.httpStatus, params.providerCode)) {
    return {
      code: 'provider_unavailable',
      ownerMessage: OWNER_SCHEDULE_PARSE_RATE_LIMITED,
      detail,
      httpStatus: 503,
    }
  }

  return {
    code: 'upstream',
    ownerMessage: OWNER_SCHEDULE_PARSE_UNAVAILABLE,
    detail,
    httpStatus: params.httpStatus >= 500 ? 502 : 503,
  }
}

export function formatParseScheduleErrorResponse(
  error: TrainingScheduleParseError,
  isAdmin: boolean,
): ParsedScheduleErrorResponse {
  if (!isAdmin) {
    return {
      error: error.ownerMessage,
      code: error.code,
    }
  }

  const summary =
    error.code === 'missing_api_key'
      ? 'Schedule auto-fill is not configured on the server.'
      : error.code === 'provider_unavailable'
        ? 'Schedule auto-fill is unavailable (vision provider capacity or configuration).'
        : error.code === 'upstream'
          ? 'Schedule auto-fill failed (upstream vision API error).'
          : error.code === 'empty_result' || error.code === 'invalid_response'
            ? error.ownerMessage
            : 'Schedule auto-fill failed.'

  return {
    error: summary,
    code: error.code,
    detail: error.detail,
  }
}
