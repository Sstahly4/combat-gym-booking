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

function getRatelimiter(): Ratelimit | null {
  if (ratelimit) return ratelimit

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    return null
  }

  ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(MAX_REQUESTS, WINDOW),
    // Prefix all keys so they're easy to inspect in the Upstash console.
    prefix: 'combatstay:rl',
    // Never throw if Redis is temporarily unreachable — fail open.
    analytics: false,
  })

  return ratelimit
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
): Promise<RateLimitResult> {
  const limiter = getRatelimiter()

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
