import type { Gym } from '@/lib/types/database'

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export type ArrivalInfoSection = {
  label: string
  value: string
  href?: string
}

export type ArrivalInfoGym = Pick<
  Gym,
  'address' | 'city' | 'country' | 'public_contact_phone' | 'google_maps_link'
> & {
  opening_hours?: Gym['opening_hours']
}

export function hasArrivalInfo(gym: ArrivalInfoGym): boolean {
  return buildArrivalInfoSections(gym).length > 0
}

export function buildArrivalInfoSections(gym: ArrivalInfoGym): ArrivalInfoSection[] {
  const sections: ArrivalInfoSection[] = []

  if (gym.address?.trim()) {
    sections.push({ label: 'Address', value: gym.address.trim() })
  } else if (gym.city && gym.country) {
    sections.push({ label: 'Location', value: `${gym.city}, ${gym.country}` })
  }

  const hours = gym.opening_hours as Record<string, string> | null | undefined
  if (hours && typeof hours === 'object') {
    const lines = DAY_ORDER.map((day) => {
      const value = hours[day]
      if (!value || value === 'closed') return null
      return `${day.charAt(0).toUpperCase()}${day.slice(1)}: ${value}`
    }).filter(Boolean) as string[]

    if (lines.length > 0) {
      sections.push({
        label: 'Opening hours',
        value: lines.join('\n'),
      })
    }
  }

  if (gym.public_contact_phone?.trim()) {
    const phone = gym.public_contact_phone.trim()
    sections.push({
      label: 'Contact on arrival',
      value: phone,
      href: `tel:${phone.replace(/\s/g, '')}`,
    })
  }

  if (gym.google_maps_link?.trim()) {
    sections.push({
      label: 'Directions',
      value: 'Open in Google Maps',
      href: gym.google_maps_link.trim(),
    })
  }

  return sections
}
