import { track } from '@vercel/analytics'

function tagClarity(...args: unknown[]) {
  if (typeof window !== 'undefined' && typeof window.clarity === 'function') {
    window.clarity(...args)
  }
}

function trackGtagEvent(
  eventName: string,
  params: Record<string, string | number>,
) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params)
  }
}

export function trackGymCardClick(params: {
  location: string
  gymName: string
  position: number
}) {
  track('Gym Card Click', {
    location: params.location,
    gym_name: params.gymName,
    position: params.position,
  })
  tagClarity('tag', 'gym_card_click', params.gymName)
  trackGtagEvent('gym_card_click', {
    location: params.location,
    gym_name: params.gymName,
    position: params.position,
  })
}

export function trackAlternativeCampClick(params: {
  sourceBrandPage: string
  destinationGym: string
}) {
  track('Alternative Camp Click', {
    source_brand_page: params.sourceBrandPage,
    destination_gym: params.destinationGym,
  })
  tagClarity('tag', 'alternative_click', params.sourceBrandPage)
  trackGtagEvent('alternative_camps_click', {
    source_brand_page: params.sourceBrandPage,
    destination_gym: params.destinationGym,
  })
}

export function trackInlineCalloutClick(params: { originPage: string }) {
  track('Inline Callout Click', {
    origin_page: params.originPage,
  })
  trackGtagEvent('inline_callout_click', {
    origin_page: params.originPage,
  })
}
