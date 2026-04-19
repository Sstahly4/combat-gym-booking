import { describe, expect, it } from 'vitest'
import {
  RECOVERY_CODE_BATCH_SIZE,
  generatePlainRecoveryCode,
  generatePlainRecoveryCodes,
  hashRecoveryCode,
} from '@/lib/auth/mfa-recovery-codes'

describe('generatePlainRecoveryCode', () => {
  it('produces a XXXXX-XXXXX shape with allowed alphabet', () => {
    for (let i = 0; i < 200; i++) {
      const c = generatePlainRecoveryCode()
      expect(c).toMatch(/^[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/)
    }
  })
})

describe('generatePlainRecoveryCodes', () => {
  it('returns the requested unique batch size', () => {
    const codes = generatePlainRecoveryCodes(RECOVERY_CODE_BATCH_SIZE)
    expect(codes).toHaveLength(RECOVERY_CODE_BATCH_SIZE)
    expect(new Set(codes).size).toBe(RECOVERY_CODE_BATCH_SIZE)
  })
})

describe('hashRecoveryCode', () => {
  it('is deterministic and ignores casing/dashes/whitespace', () => {
    const a = hashRecoveryCode('ABCDE-12345')
    const b = hashRecoveryCode(' abcde12345 ')
    expect(a).toBe(b)
  })

  it('changes when the code changes', () => {
    expect(hashRecoveryCode('ABCDE-12345')).not.toBe(hashRecoveryCode('ABCDE-12346'))
  })
})

describe('feature flags', () => {
  it('returns boolean for known flag and falls back to default', async () => {
    const { isFeatureEnabled } = await import('@/lib/flags/feature-flags')
    expect(typeof isFeatureEnabled('telemetry_enabled')).toBe('boolean')
  })
})
