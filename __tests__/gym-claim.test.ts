import { describe, expect, it } from 'vitest'
import {
  generateClaimTokenPlain,
  hashClaimToken,
  buildClaimUrl,
  buildPlaceholderEmail,
  isPlaceholderEmail,
  generatePlaceholderPassword,
  expiryDaysFromNowIso,
} from '@/lib/admin/gym-claim'
import { PLACEHOLDER_EMAIL_DOMAIN } from '@/lib/admin/gym-claim-constants'

describe('gym-claim helpers', () => {
  it('generates 64-char hex tokens by default', () => {
    const t = generateClaimTokenPlain()
    expect(t).toMatch(/^[0-9a-f]{64}$/)
  })

  it('hashes deterministically and case/whitespace-insensitively', () => {
    const a = hashClaimToken('abc123')
    const b = hashClaimToken('  ABC123  ')
    expect(a).toBe(b)
    expect(a).toMatch(/^[0-9a-f]{64}$/)
  })

  it('different tokens hash differently', () => {
    expect(hashClaimToken('one')).not.toBe(hashClaimToken('two'))
  })

  it('builds claim URL without trailing slash duplication', () => {
    expect(buildClaimUrl('https://x.com/', 'tok')).toBe('https://x.com/claim/tok')
    expect(buildClaimUrl('https://x.com', 'tok')).toBe('https://x.com/claim/tok')
  })

  it('builds and detects placeholder emails', () => {
    const email = buildPlaceholderEmail('gym-123')
    expect(email).toBe(`claim+gym-123@${PLACEHOLDER_EMAIL_DOMAIN}`)
    expect(isPlaceholderEmail(email)).toBe(true)
    expect(isPlaceholderEmail('owner@realgym.com')).toBe(false)
    expect(isPlaceholderEmail(null)).toBe(false)
  })

  it('placeholder password is sufficiently long', () => {
    const p = generatePlaceholderPassword()
    expect(p.length).toBeGreaterThanOrEqual(24)
  })

  it('expiry is in the future', () => {
    const iso = expiryDaysFromNowIso(7)
    expect(new Date(iso).getTime()).toBeGreaterThan(Date.now())
  })
})
