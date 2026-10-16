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

  it('generates short base64url tokens (~22 chars)', () => {
    const t = generateOwnerLoginTokenPlain()
    expect(t).toMatch(/^[A-Za-z0-9_-]{20,24}$/)
    expect(t.length).toBeLessThanOrEqual(24)
  })

  it('hashes deterministically after trim (case-sensitive)', () => {
    vi.stubEnv('CLAIM_TOKEN_PEPPER', 'test-pepper-value-at-least-32-chars!!')
    const a = hashOwnerLoginToken('AbC123_-xy')
    const b = hashOwnerLoginToken('  AbC123_-xy  ')
    expect(a).toBe(b)
    expect(hashOwnerLoginToken('abc123_-xy')).not.toBe(a)
    expect(a).toMatch(/^[0-9a-f]{64}$/)
  })

  it('namespaces hashes separately from an empty pepper', () => {
    vi.stubEnv('CLAIM_TOKEN_PEPPER', '')
    vi.stubEnv('OWNER_LOGIN_TOKEN_PEPPER', '')
    expect(hashOwnerLoginToken('one')).not.toBe(hashOwnerLoginToken('two'))
  })

  it('builds short /go URL without trailing slash duplication', () => {
    expect(buildOwnerLoginUrl('https://combatstay.com/', 'xK9mP2nQvR8sT1uW3yZaBc')).toBe(
      'https://combatstay.com/go/xK9mP2nQvR8sT1uW3yZaBc',
    )
    expect(buildOwnerLoginUrl('https://combatstay.com', 'tok')).toBe(
      'https://combatstay.com/go/tok',
    )
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

  it('appends go=1 hydration flag once', () => {
    expect(withOwnerLoginHydrationFlag('/manage/bookings?ref=CS-1')).toBe(
      '/manage/bookings?ref=CS-1&go=1',
    )
    expect(withOwnerLoginHydrationFlag('/manage/bookings')).toBe('/manage/bookings?go=1')
    expect(withOwnerLoginHydrationFlag('/manage/bookings?go=1')).toBe('/manage/bookings?go=1')
  })

  it('detects pepper configuration', () => {
    vi.stubEnv('CLAIM_TOKEN_PEPPER', '')
    vi.stubEnv('OWNER_LOGIN_TOKEN_PEPPER', '')
    expect(isOwnerLoginTokenPepperConfigured()).toBe(false)
    vi.stubEnv('CLAIM_TOKEN_PEPPER', 'a'.repeat(32))
    expect(isOwnerLoginTokenPepperConfigured()).toBe(true)
  })
})
