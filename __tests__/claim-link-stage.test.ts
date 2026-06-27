import { describe, expect, it } from 'vitest'
import { claimLinkStageLabel, claimLinkStageShortLabel, resolveClaimLinkStage } from '@/lib/admin/claim-link-stage'

describe('resolveClaimLinkStage', () => {
  const future = new Date(Date.now() + 86400000).toISOString()
  const past = new Date(Date.now() - 86400000).toISOString()

  it('progresses through onboarding funnel', () => {
    expect(
      resolveClaimLinkStage({
        openedAt: null,
        passwordSet: false,
        stripeConnected: false,
        revokedAt: null,
        expiresAt: future,
      }),
    ).toBe('link_sent')

    expect(
      resolveClaimLinkStage({
        openedAt: past,
        passwordSet: false,
        stripeConnected: false,
        revokedAt: null,
        expiresAt: future,
      }),
    ).toBe('clicked_not_complete')

    expect(
      resolveClaimLinkStage({
        openedAt: past,
        passwordSet: true,
        stripeConnected: false,
        revokedAt: null,
        expiresAt: future,
      }),
    ).toBe('password_added')

    expect(
      resolveClaimLinkStage({
        openedAt: past,
        passwordSet: true,
        stripeConnected: true,
        revokedAt: null,
        expiresAt: future,
      }),
    ).toBe('onboarded')
  })

  it('does not mark claim complete without password', () => {
    expect(
      resolveClaimLinkStage({
        openedAt: past,
        passwordSet: false,
        stripeConnected: false,
        revokedAt: null,
        expiresAt: future,
      }),
    ).not.toBe('onboarded')
    expect(claimLinkStageLabel('clicked_not_complete')).toBe('Clicked, not complete')
    expect(claimLinkStageShortLabel('clicked_not_complete')).toBe('Incomplete')
  })
})
