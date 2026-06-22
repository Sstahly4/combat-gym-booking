/**
 * Application-level rate limiting via Upstash Redis.
 *
 * Requires two env vars (free at upstash.com → create a Redis database):
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * When those vars are absent (local dev without Redis) the helper fails open
 * so development is unaffected. Set them in .env.local to test locally.
 *
 * Usage:
 *   const result = await checkRateLimit(request, 'auth:record-sign-in')
 *   if (!result.allowed) return result.response  // 429 JSON
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

const WINDOW = '15 m'
const MAX_REQUESTS = 10

let ratelimit: Ratelimit | null = null

/** Strip whitespace and surrounding quotes (common when pasting into Vercel env). */
function sanitizeEnvValue(value: string | undefined): string | undefined {
  if (!value) return undefined
  let v = value.trim()
  while (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim()
  }
  return v || undefined
}

function getRatelimiter(options?: {
  maxRequests?: number
  window?: `${number} ${'s' | 'm' | 'h' | 'd'}`
}): Ratelimit | null {
  const maxRequests = options?.maxRequests ?? MAX_REQUESTS
  const window = options?.window ?? WINDOW

  if (!options && ratelimit) return ratelimit

  const url = sanitizeEnvValue(process.env.UPSTASH_REDIS_REST_URL)
  const token = sanitizeEnvValue(process.env.UPSTASH_REDIS_REST_TOKEN)

  if (!url || !token) {
    return null
  }

  if (!url.startsWith('https://')) {
    console.warn(
      '[rate-limit] UPSTASH_REDIS_REST_URL must start with https:// — rate limiting disabled',
    )
    return null
  }

  try {
    const instance = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(maxRequests, window),
      prefix: 'combatstay:rl',
      analytics: false,
    })
    if (!options) ratelimit = instance
    return instance
  } catch (error) {
    console.warn('[rate-limit] Failed to initialize Upstash Redis — rate limiting disabled', error)
    return null
  }
}

type RateLimitResult =
  | { allowed: true }
  | { allowed: false; response: NextResponse }

/**
 * Checks the sliding-window rate limit for the given route identifier.
 *
 * @param request - The incoming NextRequest (used to extract the client IP).
 * @param identifier - A stable string that scopes the counter, e.g. `'auth:record-sign-in'`.
 *                     Combined with the client IP to form the Redis key.
 */
export async function checkRateLimit(
  request: NextRequest,
  identifier: string,
  options?: { maxRequests?: number; window?: `${number} ${'s' | 'm' | 'h' | 'd'}` },
): Promise<RateLimitResult> {
  const limiter = getRatelimiter(options)

  // Fail open: if Redis isn't configured (local dev), allow all requests.
  if (!limiter) return { allowed: true }

  // Prefer the first address in X-Forwarded-For (set by Vercel/proxies).
  // Fall back to a fixed string so rate limiting still works in environments
  // that don't forward the IP header (e.g. some CI runners).
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() ?? '127.0.0.1'

  const key = `${identifier}:${ip}`

  try {
    const { success, limit, remaining, reset } = await limiter.limit(key)

    if (!success) {
      const retryAfterSec = Math.ceil((reset - Date.now()) / 1000)
      return {
        allowed: false,
        response: NextResponse.json(
          { error: 'Too many attempts. Please wait and try again.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(retryAfterSec),
              'X-RateLimit-Limit': String(limit),
              'X-RateLimit-Remaining': String(remaining),
              'X-RateLimit-Reset': String(reset),
            },
          },
        ),
      }
    }

    return { allowed: true }
  } catch {
    // Redis error — fail open rather than blocking legitimate users.
    return { allowed: true }
  }
}
