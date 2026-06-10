import type { CheckoutAccordionSection } from '@/components/booking/checkout-accordion'

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export type ArrivalInfoGym = {
  name?: string | null
  address?: string | null
  city?: string | null
  country?: string | null
  public_contact_phone?: string | null
  google_maps_link?: string | null
  opening_hours?: Record<string, string> | null
}

function arrivalInstructionsBody(gym: ArrivalInfoGym): string {
  const name = gym.name?.trim()
  const gymLabel = name || 'the gym'
  return `Go to reception at ${gymLabel} on arrival and show your booking confirmation (email or reference). Your trainer or daily schedule is usually assigned at check-in. If nobody is at the front desk, call the gym contact number below.`
}

const WHAT_TO_BRING = [
  'Passport or photo ID',
  'Training gear if you have it (gloves, wraps, mouthguard) — many gyms sell or rent gear on-site',
  'Booking confirmation (email from CombatStay with your reference)',
]

function mapsHref(gym: ArrivalInfoGym): string | undefined {
  if (gym.google_maps_link?.trim()) return gym.google_maps_link.trim()
  if (gym.address?.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gym.address.trim())}`
  }
  if (gym.name && gym.city) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${gym.name} ${gym.city}`)}`
  }
  return undefined
}

function formatTrainingHours(hours: Record<string, string>): string | null {
  const lines = DAY_ORDER.map((day) => {
    const value = hours[day]
    if (!value || value === 'closed') return null
    return `${day.charAt(0).toUpperCase()}${day.slice(1)}: ${value}`
  }).filter(Boolean) as string[]

  return lines.length > 0 ? lines.join('\n') : null
}

function howToGetThereBody(gym: ArrivalInfoGym): string {
  const name = gym.name?.trim() || 'the gym'
  const city = gym.city?.trim()
  const country = gym.country?.trim()
  const address = gym.address?.trim()
  const isThailand = country?.toLowerCase() === 'thailand'

  const lines: string[] = []

  if (isThailand) {
    lines.push(
      'Grab or a taxi is the easiest way. Most drivers in Thailand know gyms by name — you usually do not need the street address.'
    )
  } else {
    lines.push('A taxi or ride-hailing app is the easiest way to get there.')
  }

  if (city) {
    lines.push(`Tell the driver "${name}" in ${city}.`)
  } else {
    lines.push(`Tell the driver "${name}".`)
  }

  if (address) {
    lines.push(`If they need more detail, show them this full address:\n${address}`)
  } else if (city || country) {
    lines.push(
      `If they ask for an address, search "${name}${city ? ` ${city}` : ''}" in Google Maps or use the link in the Address section above.`
    )
  }

  lines.push(
    'Landing at an airport? You can request an airport transfer from the gym after your booking is confirmed (see What\'s included).'
  )

  return lines.join('\n\n')
}

function howToGetThereSubtitle(gym: ArrivalInfoGym): string {
  const name = gym.name?.trim()
  if (name) {
    return gym.city?.trim() ? `Taxi or Grab to ${name}` : `Getting to ${name}`
  }
  if (gym.city?.trim()) return `Getting to ${gym.city.trim()}`
  return 'Taxi or ride-hailing recommended'
}

export function hasArrivalInfo(gym: ArrivalInfoGym): boolean {
  return !!(gym.name?.trim() || gym.address?.trim() || gym.city)
}

export function buildArrivalInfoAccordion(gym: ArrivalInfoGym): CheckoutAccordionSection[] {
  const items: CheckoutAccordionSection['items'] = []
  const maps = mapsHref(gym)
  const address = gym.address?.trim()
  const locationFallback =
    address || [gym.city, gym.country].filter(Boolean).join(', ') || 'See confirmation email for location'

  items.push({
    id: 'address',
    title: 'Address',
    subtitle: locationFallback.split('\n')[0],
    body: maps
      ? 'Open in Google Maps for directions.'
      : 'Directions link will be in your confirmation email.',
    link: maps ? { href: maps, label: 'Open in Google Maps' } : undefined,
  })

  items.push({
    id: 'how-to-get-there',
    title: 'How to get there',
    subtitle: howToGetThereSubtitle(gym),
    body: howToGetThereBody(gym),
    link: maps ? { href: maps, label: 'Open in Google Maps' } : undefined,
  })

  const hours = gym.opening_hours
  const hoursText =
    hours && typeof hours === 'object' ? formatTrainingHours(hours) : null

  items.push({
    id: 'training-hours',
    title: 'Training hours',
    subtitle: hoursText ? hoursText.split('\n')[0] : 'Confirmed by the gym after booking',
    body: hoursText
      ? `${hoursText}\n\nThese are the gym's posted hours. Your actual training sessions may be scheduled within these times — exact session times are confirmed at check-in.`
      : 'Session times are not listed for this gym yet. Most camps run a morning and afternoon session. The gym confirms your schedule when you arrive or in your confirmation email.',
  })

  items.push({
    id: 'arrival-instructions',
    title: 'Arrival instructions',
    subtitle: 'What to do when you arrive',
    body: arrivalInstructionsBody(gym),
  })

  if (gym.public_contact_phone?.trim()) {
    const phone = gym.public_contact_phone.trim()
    items.push({
      id: 'contact',
      title: 'Gym contact for day-of questions',
      subtitle: phone,
      body: 'Use this number for logistics on arrival day — directions, late check-in, or finding reception. For booking changes or refunds, contact CombatStay, not the gym.',
      link: { href: `tel:${phone.replace(/\s/g, '')}`, label: `Call ${phone}` },
    })
  }

  items.push({
    id: 'what-to-bring',
    title: 'What to bring',
    subtitle: 'Three essentials',
    body: WHAT_TO_BRING.map((line) => `• ${line}`).join('\n'),
  })

  return [{ items }]
}
