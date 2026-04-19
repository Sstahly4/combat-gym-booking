/** Discipline list — shared with search UI filters. */
export const SEARCH_DISCIPLINES = [
  'Muay Thai',
  'MMA',
  'BJJ',
  'Boxing',
  'Wrestling',
  'Kickboxing',
] as const

export function parseSearchQuery(query: string): { location: string; discipline: string } {
  if (!query.trim()) return { location: '', discipline: '' }
  let foundDiscipline = ''
  const queryLower = query.toLowerCase()
  for (const disc of SEARCH_DISCIPLINES) {
    const discLower = disc.toLowerCase()
    if (queryLower.includes(discLower)) {
      foundDiscipline = disc
      break
    }
    if (discLower === 'bjj' && (queryLower.includes('jiu jitsu') || queryLower.includes('jiujitsu'))) {
      foundDiscipline = disc
      break
    }
    if (discLower === 'muay thai' && (queryLower.includes('muaythai') || queryLower.includes('muay'))) {
      foundDiscipline = disc
      break
    }
  }
  let location = query
  if (foundDiscipline) location = query.replace(new RegExp(foundDiscipline, 'gi'), '').replace(/\s+/g, ' ').trim()
  return { location: location || '', discipline: foundDiscipline || '' }
}

function firstParam(
  sp: Record<string, string | string[] | undefined>,
  key: string
): string {
  const v = sp[key]
  if (typeof v === 'string') return v
  if (Array.isArray(v) && v[0]) return v[0]
  return ''
}

/** Full `<title>` for /search including brand suffix (matches browser tab pattern). */
export function buildSearchBrowseTitleFromSearchParams(
  sp: Record<string, string | string[] | undefined>
): string {
  const query = firstParam(sp, 'query')
  const location = firstParam(sp, 'location')
  const discipline = firstParam(sp, 'discipline')
  const parsed = parseSearchQuery(query)
  const loc = (location || parsed.location).trim()
  const disc = (discipline || parsed.discipline).trim()

  let specific: string
  if (loc && disc) {
    specific = `${disc} Camps in ${loc}`
  } else if (loc) {
    specific = `Muay Thai Camps in ${loc}`
  } else if (disc) {
    specific = `${disc} Training Camps`
  } else {
    specific = 'Browse Muay Thai & MMA Camps'
  }
  return `${specific} | Combatbooking`
}
