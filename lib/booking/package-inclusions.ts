import type { CheckoutAccordionSection } from '@/components/booking/checkout-accordion'
import type { Gym, Package, PackageVariant } from '@/lib/types/database'

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

type TrainingSchedule = Record<string, Array<{ time: string; type?: string }>>

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

function mealsInclusionLabel(package_: Package): string | null {
  if (!package_.includes_meals && package_.type !== 'all_inclusive') return null

  const m = package_.meal_plan_details
  if (m?.description?.trim()) return m.description.trim()

  const meals = [
    m?.breakfast && 'Breakfast',
    m?.lunch && 'Lunch',
    m?.dinner && 'Dinner',
  ].filter(Boolean) as string[]

  if (meals.length > 0) return meals.join(' & ')
  if (m?.meals_per_day) {
    return `${m.meals_per_day} meal${m.meals_per_day > 1 ? 's' : ''} per day`
  }
  return 'Meals included'
}

function accommodationInclusionLabel(
  package_: Package,
  variant?: PackageVariant | null
): string | null {
  const hasAccommodation =
    package_.includes_accommodation ||
    package_.type === 'accommodation' ||
    package_.type === 'all_inclusive'

  if (!hasAccommodation) return null

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

  if (package_.type === 'training') return 'Training sessions included'
  return 'Training sessions included'
}

/**
 * Top package inclusions for checkout (Step 3). Priority: training, accommodation,
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

  if (package_.type !== 'accommodation') {
    push(trainingInclusionLabel(package_, gym))
  }

  push(accommodationInclusionLabel(package_, variant))
  push(mealsInclusionLabel(package_))

  if (amenities?.airport_transfer) push('Airport transfer available')
  if (amenities?.physiotherapy || amenities?.recovery_facilities) {
    push('Physiotherapy & recovery on-site')
  }
  if (amenities?.nutritionist) push('Nutritionist on-site')

  return lines
}

function inclusionDetailBody(label: string, package_: Package): string {
  if (label.startsWith('Training')) {
    return 'Training sessions are included for the dates of your booking. Session times follow the gym schedule — confirm exact times with the gym after booking.'
  }
  if (label.startsWith('Accommodation')) {
    const room =
      label.includes('Private') ? 'a private room' : label.includes('Shared') ? 'a shared room' : 'accommodation'
    return `Your package includes ${room} for the nights covered by this booking. Check-in details are confirmed by the gym before arrival.`
  }
  if (
    label.includes('Breakfast') ||
    label.includes('Lunch') ||
    label.includes('Dinner') ||
    label.includes('meal')
  ) {
    return 'Meals included in your package are provided by the gym as described on the listing. Dietary requirements can usually be discussed directly with the gym after booking.'
  }
  if (label.includes('Airport transfer')) {
    return 'Airport transfer can be arranged with the gym after your booking is confirmed. It is not automatically booked at checkout unless stated otherwise on the package page.'
  }
  if (label.includes('Physiotherapy')) {
    return 'Recovery and physiotherapy services are available at the gym. Book sessions directly with the gym after arrival.'
  }
  if (label.includes('Nutritionist')) {
    return 'Nutrition support is available at the gym. Arrange consultations directly after booking or on arrival.'
  }
  return `${label} is part of this package. Contact the gym after booking if you need more detail.`
}

export function buildPackageInclusionAccordion(
  package_: Package,
  gym: Pick<Gym, 'amenities'> & { training_schedule?: Gym['training_schedule'] },
  variant?: PackageVariant | null
): CheckoutAccordionSection[] {
  const lines = buildPackageInclusionLines(package_, gym, variant, 8)
  if (lines.length === 0) return []

  return [
    {
      items: lines.map((line, index) => ({
        id: `inclusion-${index}`,
        title: line.split(' — ')[0] ?? line,
        subtitle: line.includes(' — ') ? line.split(' — ').slice(1).join(' — ') : undefined,
        body: inclusionDetailBody(line, package_),
      })),
      footerText:
        'Inclusions shown are based on this package and gym listing. The gym confirms final details after booking.',
    },
  ]
}
