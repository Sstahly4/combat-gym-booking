import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  generateOwnerLoginTokenPlain,
  hashOwnerLoginToken,
  buildOwnerLoginUrl,
  expiryDaysFromNowIso,
  sanitizeOwnerLoginRedirectPath,
  withOwnerLoginHydrationFlag,
  isOwnerLoginTokenPepperConfigured,
} from '@/lib/auth/owner-login-link'

describe('owner-login-link helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('generates 64-char hex tokens', () => {
    const t = generateOwnerLoginTokenPlain()
    expect(t).toMatch(/^[0-9a-f]{64}$/)
  })

  it('hashes deterministically and case/whitespace-insensitively', () => {
    vi.stubEnv('CLAIM_TOKEN_PEPPER', 'test-pepper-value-at-least-32-chars!!')
    const a = hashOwnerLoginToken('abc123')
    const b = hashOwnerLoginToken('  ABC123  ')
    expect(a).toBe(b)
    expect(a).toMatch(/^[0-9a-f]{64}$/)
  })

  it('namespaces hashes separately from an empty pepper', () => {
    vi.stubEnv('CLAIM_TOKEN_PEPPER', '')
    vi.stubEnv('OWNER_LOGIN_TOKEN_PEPPER', '')
    expect(hashOwnerLoginToken('one')).not.toBe(hashOwnerLoginToken('two'))
  })

  it('builds /ol URL without trailing slash duplication', () => {
    expect(buildOwnerLoginUrl('https://x.com/', 'tok')).toBe('https://x.com/ol/tok')
    expect(buildOwnerLoginUrl('https://x.com', 'tok')).toBe('https://x.com/ol/tok')
  })

  it('sanitizes redirect paths to Partner Hub only', () => {
    expect(sanitizeOwnerLoginRedirectPath('/manage/bookings?ref=CS-1')).toBe(
      '/manage/bookings?ref=CS-1',
    )
    expect(sanitizeOwnerLoginRedirectPath('/manage')).toBe('/manage')
    expect(sanitizeOwnerLoginRedirectPath('https://evil.com')).toBe('/manage/bookings')
    expect(sanitizeOwnerLoginRedirectPath('//evil.com')).toBe('/manage/bookings')
    expect(sanitizeOwnerLoginRedirectPath('/auth/signin')).toBe('/manage/bookings')
    expect(sanitizeOwnerLoginRedirectPath(null)).toBe('/manage/bookings')
  })

  it('expiry is in the future', () => {
    const iso = expiryDaysFromNowIso(7)
    expect(new Date(iso).getTime()).toBeGreaterThan(Date.now())
  })

  it('appends ol=1 hydration flag once', () => {
    expect(withOwnerLoginHydrationFlag('/manage/bookings?ref=CS-1')).toBe(
      '/manage/bookings?ref=CS-1&ol=1',
    )
    expect(withOwnerLoginHydrationFlag('/manage/bookings')).toBe('/manage/bookings?ol=1')
    expect(withOwnerLoginHydrationFlag('/manage/bookings?ol=1')).toBe('/manage/bookings?ol=1')
  })

  it('detects pepper configuration', () => {
    vi.stubEnv('CLAIM_TOKEN_PEPPER', '')
    vi.stubEnv('OWNER_LOGIN_TOKEN_PEPPER', '')
    expect(isOwnerLoginTokenPepperConfigured()).toBe(false)
    vi.stubEnv('CLAIM_TOKEN_PEPPER', 'a'.repeat(32))
    expect(isOwnerLoginTokenPepperConfigured()).toBe(true)
  })
})
