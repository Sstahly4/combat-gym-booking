import { describe, expect, it } from 'vitest'
import {
  generateClaimTokenPlain,
  hashClaimToken,
  hashClaimTokenCandidates,
  buildClaimUrl,
  buildPlaceholderEmail,
  isPlaceholderEmail,
  generatePlaceholderPassword,
  expiryDaysFromNowIso,
} from '@/lib/admin/gym-claim'
import { PLACEHOLDER_EMAIL_DOMAIN } from '@/lib/admin/gym-claim-constants'

describe('gym-claim helpers', () => {
  it('generates short base64url tokens (~22 chars)', () => {
    const t = generateClaimTokenPlain()
    expect(t).toMatch(/^[A-Za-z0-9_-]{20,24}$/)
    expect(t.length).toBeLessThanOrEqual(24)
  })

  it('hashes deterministically after trim (case-sensitive)', () => {
    const a = hashClaimToken('AbC123_-xy')
    const b = hashClaimToken('  AbC123_-xy  ')
    expect(a).toBe(b)
    expect(hashClaimToken('abc123_-xy')).not.toBe(a)
    expect(a).toMatch(/^[0-9a-f]{64}$/)
  })

  it('different tokens hash differently', () => {
    expect(hashClaimToken('one')).not.toBe(hashClaimToken('two'))
  })

  it('candidates include lowercase fallback for legacy hex links', () => {
    const hex = 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789'
    expect(hashClaimTokenCandidates(hex)).toEqual([hashClaimToken(hex)])
    const mixed = 'AbCdEf'
    const cands = hashClaimTokenCandidates(mixed)
    expect(cands).toHaveLength(2)
    expect(cands[0]).toBe(hashClaimToken(mixed))
  })

  it('builds short claim URL without trailing slash duplication', () => {
    expect(buildClaimUrl('https://combatstay.com/', 'xK9mP2nQvR8sT1uW3yZaBc')).toBe(
      'https://combatstay.com/claim/xK9mP2nQvR8sT1uW3yZaBc',
    )
    expect(buildClaimUrl('https://combatstay.com', 'tok')).toBe(
      'https://combatstay.com/claim/tok',
    )
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
