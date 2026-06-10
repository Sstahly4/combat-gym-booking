import type { CheckoutAccordionSection } from '@/components/booking/checkout-accordion'
import type { Gym, Package, PackageVariant } from '@/lib/types/database'

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

type TrainingSchedule = Record<string, Array<{ time: string; type?: string }>>

const WHATS_NOT_INCLUDED =
  'Not included: flights, travel insurance, visa fees, and personal spending. Optional extras (private sessions, gear purchases, meals not listed above) are paid separately unless stated on the package page.'

function trainingFrequencyLabel(schedule: TrainingSchedule | null | undefined): string | null {
  if (!schedule || typeof schedule !== 'object') return null
  let maxPerDay = 0
  for (const day of DAY_ORDER) {
    const count = schedule[day]?.length ?? 0
    if (count > maxPerDay) maxPerDay = count
  }
  if (maxPerDay >= 2) return 'Training twice daily'
  if (maxPerDay === 1) return 'Training once daily'
  return null
}

function parseHour(time: string): number | null {
  const match = time.match(/^(\d{1,2})/)
  if (!match) return null
  return parseInt(match[1], 10)
}

function formatTrainingScheduleDetail(
  schedule: TrainingSchedule | null | undefined
): { sessionsPerDay: number; slotSummary: string; typeSummary: string } | null {
  if (!schedule || typeof schedule !== 'object') return null

  let maxPerDay = 0
  let sampleDay: string | null = null
  for (const day of DAY_ORDER) {
    const sessions = schedule[day]
    if (!sessions?.length) continue
    if (sessions.length >= maxPerDay) {
      maxPerDay = sessions.length
      sampleDay = day
    }
  }
  if (!sampleDay || maxPerDay === 0) return null

  const sessions = schedule[sampleDay] ?? []
  const morning = sessions.filter((s) => {
    const h = parseHour(s.time)
    return h != null && h < 12
  })
  const afternoon = sessions.filter((s) => {
    const h = parseHour(s.time)
    return h != null && h >= 12
  })

  const timeParts: string[] = []
  if (morning.length > 0) timeParts.push('morning')
  if (afternoon.length > 0) timeParts.push('afternoon')
  const slotSummary =
    timeParts.length > 0
      ? timeParts.join(' and ')
      : `${sessions.length} session${sessions.length === 1 ? '' : 's'} per day`

  const sessionLines = sessions
    .slice(0, 3)
    .map((s) => (s.type ? `${s.time} ${s.type}` : s.time))
    .join(', ')

  const types = [
    ...new Set(
      sessions.map((s) => s.type?.trim()).filter(Boolean) as string[]
    ),
  ]
  const typeSummary =
    types.length > 0
      ? types.join(', ')
      : 'pad work, technique drills, and conditioning'

  return {
    sessionsPerDay: maxPerDay,
    slotSummary,
    typeSummary: sessionLines ? `Example: ${sessionLines}` : typeSummary,
  }
}

function packageIncludesTraining(package_: Package): boolean {
  return package_.type !== 'accommodation'
}

function packageIncludesAccommodation(
  package_: Package,
  variant?: PackageVariant | null
): boolean {
  return (
    package_.includes_accommodation ||
    package_.type === 'accommodation' ||
    package_.type === 'all_inclusive' ||
    !!variant
  )
}

function buildTrainingAccordionItem(
  package_: Package,
  gym: Pick<Gym, 'amenities'> & { training_schedule?: Gym['training_schedule'] }
) {
  const schedule = gym.training_schedule as TrainingSchedule | null | undefined
  const parsed = formatTrainingScheduleDetail(schedule)
  const freq = trainingFrequencyLabel(schedule)
  const amenities = gym.amenities as Record<string, boolean> | null | undefined

  const sessionsLabel = parsed
    ? `${parsed.sessionsPerDay} session${parsed.sessionsPerDay === 1 ? '' : 's'} per day`
    : freq ?? 'Daily training sessions'

  const subtitle = parsed
    ? `${sessionsLabel} · ${parsed.slotSummary}`
    : sessionsLabel

  let body =
    'Training is included for every day of your booking. Most camps run structured group sessions — pad work, technique, and conditioning. '

  if (parsed) {
    body += `This gym typically runs ${parsed.sessionsPerDay} session${parsed.sessionsPerDay === 1 ? '' : 's'} per day (${parsed.slotSummary}). ${parsed.typeSummary}. `
  } else {
    body +=
      'Morning and afternoon sessions are common at Thai camps. Exact times and whether sparring is included are confirmed by the gym after booking. '
  }

  if (amenities?.beginner_friendly) {
    body += 'This gym welcomes beginners — coaches adjust intensity to your level. '
  } else {
    body += 'Suitable for most experience levels unless the package notes otherwise. '
  }

  body += 'Your trainer or session schedule is usually assigned at check-in.'

  return {
    id: 'training',
    title: 'Training',
    subtitle,
    body,
  }
}

function buildAccommodationAccordionItem(
  package_: Package,
  variant: PackageVariant | null | undefined,
  gym: Pick<Gym, 'amenities'> & { offers_accommodation?: boolean }
) {
  const amenities = gym.amenities as Record<string, boolean> | null | undefined
  const onSite = !!(amenities?.accommodation || gym.offers_accommodation)

  const roomLabel =
    variant?.room_type === 'private'
      ? 'Private room'
      : variant?.room_type === 'shared'
        ? 'Shared room'
        : package_.accommodation_name?.trim() || variant?.name?.trim() || 'Room'

  const bathroomNote =
    variant?.room_type === 'shared'
      ? 'Shared bathroom facilities'
      : variant?.room_type === 'private'
        ? 'Private room — bathroom arrangement confirmed by the gym'
        : 'Bathroom arrangement confirmed by the gym'

  const locationNote = onSite
    ? 'On-site at the gym — you sleep where you train (or in the gym\'s own accommodation block).'
    : 'Near the gym — not always in the same building as the training floor. The gym confirms exact location after booking.'

  const subtitle = `${roomLabel} · ${onSite ? 'On-site' : 'Near gym'}`

  const body = [
    `Your package includes ${roomLabel.toLowerCase()} for the nights covered by this booking.`,
    locationNote,
    bathroomNote + '.',
    variant?.description?.trim() ||
      (package_.accommodation_name
        ? `Listed as: ${package_.accommodation_name}.`
        : 'Bed configuration and exact room type are confirmed by the gym before arrival.'),
    'If you assumed you would sleep at the gym, check the location note above — many "train & stay" packages are on-site, but some use partner accommodation nearby.',
  ].join(' ')

  return {
    id: 'accommodation',
    title: 'Accommodation',
    subtitle,
    body,
  }
}

function buildMealsAccordionItem(package_: Package) {
  const m = package_.meal_plan_details
  const hasMeals = package_.includes_meals || package_.type === 'all_inclusive'
  if (!hasMeals) return null

  if (m?.description?.trim()) {
    return {
      id: 'meals',
      title: 'Meals',
      subtitle: m.description.trim(),
      body: `${m.description.trim()}. Dietary requirements can usually be discussed with the gym after booking. Meals not described here are at your own expense.`,
    }
  }

  const included: string[] = []
  const notIncluded: string[] = []
  if (m?.breakfast) included.push('breakfast')
  else notIncluded.push('breakfast')
  if (m?.lunch) included.push('lunch')
  else notIncluded.push('lunch')
  if (m?.dinner) included.push('dinner')
  else notIncluded.push('dinner')

  let subtitle: string
  let body: string

  if (included.length === 0 && m?.meals_per_day) {
    subtitle = `${m.meals_per_day} meal${m.meals_per_day > 1 ? 's' : ''} per day included`
    body = `${subtitle}. Which meals (breakfast, lunch, or dinner) are included is confirmed by the gym — ask when you book if you need certainty. Any meals not provided are at your own expense.`
  } else if (included.length > 0) {
    const includedLabel = included
      .map((meal) => meal.charAt(0).toUpperCase() + meal.slice(1))
      .join(' and ')
    subtitle =
      notIncluded.length < 3
        ? `${includedLabel} included · ${notIncluded.map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join(' and ')} at your own expense`
        : `${includedLabel} included`
    body = `${includedLabel} are included as part of this package. `
    if (notIncluded.length > 0 && notIncluded.length < 3) {
      body += `${notIncluded.map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join(' and ')} are not included — budget for those separately. `
    }
    body += 'Dietary requirements can usually be discussed with the gym after booking.'
  } else {
    subtitle = 'Meals included'
    body =
      'Meals are included as described on the package page. Confirm which meals (breakfast, lunch, dinner) with the gym after booking. Anything not listed is at your own expense.'
  }

  return { id: 'meals', title: 'Meals', subtitle, body }
}

function buildEquipmentAccordionItem(
  gym: Pick<Gym, 'amenities'>
) {
  const amenities = gym.amenities as Record<string, boolean> | null | undefined
  const rental = amenities?.rental_equipment
  const wraps = amenities?.hand_wraps_available
  const proShop = amenities?.pro_shop

  let subtitle: string
  if (rental && wraps) subtitle = 'Gloves and wraps available at the gym'
  else if (rental) subtitle = 'Training gear available to rent or borrow'
  else if (proShop) subtitle = 'Gear shop on-site — bring basics if you can'
  else subtitle = 'Bring your own gloves and wraps'

  const parts = [
    'For your first camp, plan to bring hand wraps, a mouthguard, and training clothes you can sweat in.',
  ]
  if (rental) {
    parts.push(
      'This gym offers equipment rental (gloves, shin guards, and similar). Availability and any rental fee are confirmed on arrival — do not assume unlimited free gear.'
    )
  } else {
    parts.push(
      'Gloves are not automatically provided. Many travelers buy gloves locally after arrival (often cheaper and already broken in). Confirm with the gym if you want to borrow gear for your first session.'
    )
  }
  if (wraps) {
    parts.push('Hand wraps may be available for purchase or included — bring your own pair if you already have favourites.')
  }
  if (proShop) {
    parts.push('There is a pro shop on-site for gloves, shorts, and other gear.')
  }
  parts.push('Shin guards are recommended for sparring if your sessions include it.')

  return {
    id: 'equipment',
    title: 'Equipment',
    subtitle,
    body: parts.join(' '),
  }
}

function buildAirportTransferAccordionItem() {
  return {
    id: 'airport-transfer',
    title: 'Airport transfer',
    subtitle: 'On request — not booked automatically',
    body:
      'Airport pickup can be arranged with the gym, but it is not included in your checkout payment unless the package page says otherwise. After your booking is confirmed, message the gym (or reply to your confirmation email) with your flight details to request a transfer. Price and availability are agreed directly with the gym.',
  }
}

export function mealsInclusionLabel(package_: Package): string | null {
  const item = buildMealsAccordionItem(package_)
  return item?.subtitle ?? null
}

function accommodationInclusionLabel(
  package_: Package,
  variant?: PackageVariant | null
): string | null {
  if (!packageIncludesAccommodation(package_, variant)) return null

  if (variant?.room_type === 'private') return 'Accommodation — Private room'
  if (variant?.room_type === 'shared') return 'Accommodation — Shared room'
  if (package_.accommodation_name?.trim()) {
    return `Accommodation — ${package_.accommodation_name.trim()}`
  }
  return 'Accommodation included'
}

function trainingInclusionLabel(
  package_: Package,
  gym: { training_schedule?: Gym['training_schedule'] }
): string {
  const fromSchedule = trainingFrequencyLabel(
    gym.training_schedule as TrainingSchedule | null | undefined
  )
  if (fromSchedule) return fromSchedule
  return 'Training sessions included'
}

/**
 * Top package inclusions for checkout rows. Priority: training, accommodation,
 * meals, airport transfer — capped at `maxItems` (default 4).
 */
export function buildPackageInclusionLines(
  package_: Package,
  gym: Pick<Gym, 'amenities'> & { training_schedule?: Gym['training_schedule'] },
  variant?: PackageVariant | null,
  maxItems = 4
): string[] {
  const amenities = gym.amenities as Record<string, boolean> | null | undefined
  const lines: string[] = []

  const push = (line: string | null) => {
    if (!line || lines.includes(line) || lines.length >= maxItems) return
    lines.push(line)
  }

  if (packageIncludesTraining(package_)) {
    push(trainingInclusionLabel(package_, gym))
  }

  push(accommodationInclusionLabel(package_, variant))
  push(mealsInclusionLabel(package_))

  if (amenities?.airport_transfer) push('Airport transfer available')

  return lines
}

export function buildPackageInclusionAccordion(
  package_: Package,
  gym: Pick<Gym, 'amenities'> & {
    training_schedule?: Gym['training_schedule']
    offers_accommodation?: boolean
  },
  variant?: PackageVariant | null
): CheckoutAccordionSection[] {
  const amenities = gym.amenities as Record<string, boolean> | null | undefined
  const items = []

  if (packageIncludesTraining(package_)) {
    items.push(buildTrainingAccordionItem(package_, gym))
  }

  if (packageIncludesAccommodation(package_, variant)) {
    items.push(buildAccommodationAccordionItem(package_, variant, gym))
  }

  const meals = buildMealsAccordionItem(package_)
  if (meals) items.push(meals)

  items.push(buildEquipmentAccordionItem(gym))

  if (amenities?.airport_transfer) {
    items.push(buildAirportTransferAccordionItem())
  }

  if (items.length === 0) return []

  return [
    {
      items,
      footerText: WHATS_NOT_INCLUDED,
    },
  ]
}
