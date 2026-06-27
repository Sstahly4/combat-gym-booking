import { describe, expect, it } from 'vitest'
import {
  platformStageLabel,
  platformStageSheetStatus,
  platformStageShortLabel,
  resolvePlatformStage,
} from '@/lib/admin/platform-stage'

describe('resolvePlatformStage', () => {
  const future = new Date(Date.now() + 86400000).toISOString()
  const past = new Date(Date.now() - 86400000).toISOString()

  it('progresses through onboarding funnel', () => {
    expect(
      resolvePlatformStage({
        hasToken: true,
        ownerOpenedAt: null,
        outreachSentAt: null,
        passwordSet: false,
        stripeConnected: false,
        revokedAt: null,
        expiresAt: future,
      }),
    ).toBe('link_ready')

    expect(
      resolvePlatformStage({
        hasToken: true,
        ownerOpenedAt: null,
        outreachSentAt: past,
        passwordSet: false,
        stripeConnected: false,
        revokedAt: null,
        expiresAt: future,
      }),
    ).toBe('link_sent')

    expect(
      resolvePlatformStage({
        hasToken: true,
        ownerOpenedAt: past,
        outreachSentAt: past,
        passwordSet: false,
        stripeConnected: false,
        revokedAt: null,
        expiresAt: future,
      }),
    ).toBe('clicked')

    expect(
      resolvePlatformStage({
        hasToken: true,
        ownerOpenedAt: past,
        outreachSentAt: past,
        passwordSet: true,
        stripeConnected: false,
        revokedAt: null,
        expiresAt: future,
      }),
    ).toBe('claimed')

    expect(
      resolvePlatformStage({
        hasToken: true,
        ownerOpenedAt: past,
        outreachSentAt: past,
        passwordSet: true,
        stripeConnected: true,
        revokedAt: null,
        expiresAt: future,
      }),
    ).toBe('onboarded')
  })

  it('does not count admin first open as clicked without owner_first_opened_at', () => {
    expect(
      resolvePlatformStage({
        hasToken: true,
        ownerOpenedAt: null,
        outreachSentAt: null,
        passwordSet: false,
        stripeConnected: false,
        revokedAt: null,
        expiresAt: future,
      }),
    ).not.toBe('clicked')
  })

  it('maps sheet status labels for Dev B sync', () => {
    expect(platformStageSheetStatus('clicked')).toBe('Clicked — incomplete')
    expect(platformStageShortLabel('claimed')).toBe('Claimed')
    expect(platformStageLabel('link_ready')).toBe('Link ready')
  })
})
