import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import {
  isClaimProduction,
  isClaimTokenPepperConfigured,
} from '@/lib/admin/gym-claim-env'

describe('gym-claim-env', () => {
  beforeEach(() => {
    vi.stubEnv('CLAIM_TOKEN_PEPPER', '')
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('VERCEL_ENV', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('isClaimProduction when NODE_ENV is production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect(isClaimProduction()).toBe(true)
  })

  it('isClaimProduction when VERCEL_ENV is production', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(isClaimProduction()).toBe(true)
  })

  it('isClaimTokenPepperConfigured requires 32+ chars', () => {
    vi.stubEnv('CLAIM_TOKEN_PEPPER', 'a'.repeat(31))
    expect(isClaimTokenPepperConfigured()).toBe(false)
    vi.stubEnv('CLAIM_TOKEN_PEPPER', 'a'.repeat(32))
    expect(isClaimTokenPepperConfigured()).toBe(true)
  })
})
