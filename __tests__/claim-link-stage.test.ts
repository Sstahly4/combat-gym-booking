import { describe, expect, it } from 'vitest'
import { resolveClaimLinkStage } from '@/lib/admin/claim-link-stage'

describe('resolveClaimLinkStage (legacy wrapper)', () => {
  const future = new Date(Date.now() + 86400000).toISOString()
  const past = new Date(Date.now() - 86400000).toISOString()

  it('delegates to platform stage resolver using ownerOpenedAt as openedAt', () => {
    expect(
      resolveClaimLinkStage({
        openedAt: past,
        passwordSet: true,
        stripeConnected: false,
        revokedAt: null,
        expiresAt: future,
      }),
    ).toBe('claimed')
  })
})
