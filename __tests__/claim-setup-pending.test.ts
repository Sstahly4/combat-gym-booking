import { describe, expect, it } from 'vitest'
import { isClaimSetupPending } from '@/lib/admin/claim-setup-pending'

describe('isClaimSetupPending', () => {
  it('is true for placeholder owners without a password', () => {
    expect(
      isClaimSetupPending({ placeholder_account: true, claim_password_set: false }),
    ).toBe(true)
  })

  it('is false once claim password is set on a real account', () => {
    expect(
      isClaimSetupPending({ placeholder_account: false, claim_password_set: true }),
    ).toBe(false)
  })

  it('is false for missing profile', () => {
    expect(isClaimSetupPending(null)).toBe(false)
  })
})
