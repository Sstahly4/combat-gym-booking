import {
  enabledGymAmenityLabels,
  mergeGymAmenitiesFromDb,
} from '@/lib/constants/gym-amenities'

export function buildGymMetaDescription(input: {
  name: string
  city?: string | null
  tagline?: string | null
  description?: string | null
  firstDiscipline?: string
  amenities?: Record<string, unknown> | null
}): string {
  const name = input.name?.trim() || 'Training Camp'
  const city = input.city?.trim() || ''
  const firstDiscipline = input.firstDiscipline?.trim() || 'combat sports'

  let metaDescription = `Train ${firstDiscipline} at ${name}${city ? ` in ${city}` : ''}.`

  const tagline = input.tagline?.trim()
  if (tagline) {
    metaDescription += ` ${tagline}`
  } else {
    const rawDesc = input.description?.trim()
    if (rawDesc) {
      const firstSentence = rawDesc.split(/[.!?]/)[0]?.trim()
      if (firstSentence && firstSentence.length > 15) {
        metaDescription += ` ${firstSentence}.`
      }
    }
  }

  metaDescription += ' Book instantly.'

  const amenityHighlights = enabledGymAmenityLabels(input.amenities, 3)
  if (amenityHighlights.length > 0) {
    metaDescription += ` Amenities: ${amenityHighlights.join(', ')}.`
  }

  if (metaDescription.length > 160) {
    return `${metaDescription.substring(0, 157)}...`
  }
  return metaDescription
}

export function gymAmenitySchemaFeatures(
  amenities: Record<string, unknown> | null | undefined,
): Array<{ '@type': 'LocationFeatureSpecification'; name: string; value: true }> | undefined {
  const merged = mergeGymAmenitiesFromDb(amenities)
  const features = enabledGymAmenityLabels(merged, 12).map((name) => ({
    '@type': 'LocationFeatureSpecification' as const,
    name,
    value: true as const,
  }))
  return features.length > 0 ? features : undefined
}
