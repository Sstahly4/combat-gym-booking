/**
 * Admin bulk gym import from CSV — parsing, normalization, discipline mapping,
 * and duplicate detection helpers (preview + commit validate the same shapes).
 */
import countries from 'i18n-iso-countries'
import enLocale from 'i18n-iso-countries/langs/en.json'

countries.registerLocale(enLocale)

export const BULK_IMPORT_MAX_ROWS = 200

/** Canonical discipline labels aligned with owner gym edit UI. */
export const CANONICAL_DISCIPLINES = [
  'Muay Thai',
  'MMA',
  'BJJ',
  'Boxing',
  'Wrestling',
  'Kickboxing',
  'All Sports',
] as const

const ALIAS_TO_CANONICAL: Record<string, string> = {
  'muay thai': 'Muay Thai',
  muaythai: 'Muay Thai',
  mt: 'Muay Thai',
  mma: 'MMA',
  bjj: 'BJJ',
  'brazilian jiu jitsu': 'BJJ',
  'jiu jitsu': 'BJJ',
  jiujitsu: 'BJJ',
  'jui jitsu': 'BJJ',
  boxing: 'Boxing',
  wrestling: 'Wrestling',
  kickboxing: 'Kickboxing',
  'kick boxing': 'Kickboxing',
  'all sports': 'All Sports',
  grappling: 'BJJ',
}

const TRACKING_QUERY_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'gclid',
  '_ga',
])

export type BulkDuplicateTier = 'maps' | 'identity'

export interface BulkGymDuplicateGym {
  id: string
  name: string
  address: string | null
  city: string
  country: string
  google_maps_link: string | null
  disciplines: string[]
  verification_status: string
}

export interface BulkGymCatalogEntry {
  id: string
  name: string
  address: string | null
  city: string
  country: string
  google_maps_link: string | null
  disciplines: string[]
  verification_status: string
  maps_fp: string | null
  identity_fp: string
}

export interface BulkImportParsedRow {
  rowIndex: number
  name: string
  /** Street / full address when the sheet has an address column. */
  address: string | null
  city: string
  country: string
  google_maps_link: string | null
  disciplines: string[]
  /** From an accommodation / stays column (Yes/No), else false. */
  offers_accommodation: boolean
  /** Raw sports cell before mapping (for preview). */
  sports_raw: string
  errors: string[]
  duplicate_matches: Array<{ tier: BulkDuplicateTier; gym: BulkGymDuplicateGym }>
}

export interface BulkImportRowResolution {
  row_index: number
  action: 'create' | 'skip' | 'update' | 'create_anyway'
  /** Required when action is `update`. */
  existing_gym_id?: string
}

export function normalizeWhitespace(s: string): string {
  return s.trim().replace(/\s+/g, ' ')
}

export function normalizeGoogleMapsFingerprint(raw: string | null | undefined): string | null {
  if (raw == null) return null
  const t = raw.trim()
  if (!t) return null
  try {
    const withScheme = /^https?:\/\//i.test(t) ? t : `https://${t}`
    const u = new URL(withScheme)
    const host = u.hostname.replace(/^www\./i, '').toLowerCase()
    const placeId = u.searchParams.get('place_id') || u.searchParams.get('query_place_id')
    if (placeId) return `place:${placeId}`

    for (const key of [...u.searchParams.keys()]) {
      if (key.startsWith('utm_')) u.searchParams.delete(key)
    }
    TRACKING_QUERY_PARAMS.forEach((p) => u.searchParams.delete(p))

    const path = (u.pathname || '/').replace(/\/+$/, '') || '/'
    const qs = u.searchParams.toString()
    return `url:${host}${path}${qs ? `?${qs}` : ''}`.toLowerCase()
  } catch {
    return `raw:${t.toLowerCase().replace(/\s+/g, ' ')}`
  }
}

export function normalizeCountryLabel(raw: string): { country: string; error?: string } {
  const t = raw.trim()
  if (!t) return { country: '' }
  if (t.length === 2 && /^[a-zA-Z]{2}$/.test(t)) {
    const name = countries.getName(t.toUpperCase(), 'en')
    if (name) return { country: name }
    return { country: t, error: `Unknown ISO country code: ${t.toUpperCase()}` }
  }
  const alpha2 = countries.getAlpha2Code(t, 'en')
  if (alpha2) {
    const name = countries.getName(alpha2, 'en')
    if (name) return { country: name }
  }
  return { country: t }
}

function identityFingerprint(name: string, city: string, country: string): string {
  const n = normalizeWhitespace(name).toLowerCase()
  const c = normalizeWhitespace(city).toLowerCase()
  const co = normalizeWhitespace(country).toLowerCase()
  return `${n}\t${c}\t${co}`
}

export function toCatalogEntry(row: {
  id: string
  name: string
  address?: string | null
  city: string
  country: string
  google_maps_link: string | null
  disciplines: string[] | null
  verification_status: string | null
}): BulkGymCatalogEntry {
  const name = row.name ?? ''
  const city = row.city ?? ''
  const country = row.country ?? ''
  return {
    id: row.id,
    name,
    address: row.address ?? null,
    city,
    country,
    google_maps_link: row.google_maps_link,
    disciplines: Array.isArray(row.disciplines) ? row.disciplines : [],
    verification_status: row.verification_status ?? '',
    maps_fp: normalizeGoogleMapsFingerprint(row.google_maps_link),
    identity_fp: identityFingerprint(name, city, country),
  }
}

function gymToDuplicateShape(g: BulkGymCatalogEntry): BulkGymDuplicateGym {
  return {
    id: g.id,
    name: g.name,
    address: g.address,
    city: g.city,
    country: g.country,
    google_maps_link: g.google_maps_link,
    disciplines: g.disciplines,
    verification_status: g.verification_status,
  }
}

export function findDuplicateMatches(
  parsed: Pick<BulkImportParsedRow, 'name' | 'city' | 'country' | 'google_maps_link'>,
  catalog: BulkGymCatalogEntry[],
): Array<{ tier: BulkDuplicateTier; gym: BulkGymDuplicateGym }> {
  const rowMaps = normalizeGoogleMapsFingerprint(parsed.google_maps_link)
  const rowId = identityFingerprint(parsed.name, parsed.city, parsed.country)
  const seen = new Set<string>()
  const out: Array<{ tier: BulkDuplicateTier; gym: BulkGymDuplicateGym }> = []

  if (rowMaps) {
    for (const g of catalog) {
      if (!g.maps_fp || g.maps_fp !== rowMaps) continue
      if (seen.has(g.id)) continue
      seen.add(g.id)
      out.push({ tier: 'maps', gym: gymToDuplicateShape(g) })
    }
    if (out.length) return out
  }

  const nameKey = normalizeWhitespace(parsed.name).toLowerCase()
  if (!nameKey) return []

  for (const g of catalog) {
    if (g.identity_fp !== rowId) continue
    if (seen.has(g.id)) continue
    seen.add(g.id)
    out.push({ tier: 'identity', gym: gymToDuplicateShape(g) })
  }
  return out
}

export function mapDisciplineCell(raw: string): { disciplines: string[]; unknown_tokens: string[] } {
  const parts = raw
    .split(/[,;/|]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const disciplines: string[] = []
  const unknown: string[] = []
  const seen = new Set<string>()

  for (const part of parts) {
    const key = part.toLowerCase().replace(/\s+/g, ' ')
    const canon = ALIAS_TO_CANONICAL[key]
    if (canon) {
      if (!seen.has(canon)) {
        seen.add(canon)
        disciplines.push(canon)
      }
      continue
    }
    const title = part
      .split(/\s+/)
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ''))
      .join(' ')
    const direct = CANONICAL_DISCIPLINES.find((d) => d.toLowerCase() === title.toLowerCase())
    if (direct) {
      if (!seen.has(direct)) {
        seen.add(direct)
        disciplines.push(direct)
      }
      continue
    }
    unknown.push(part)
  }

  return { disciplines, unknown_tokens: unknown }
}

/** Minimal CSV parser (quoted fields, CRLF, UTF-8 BOM). */
/** Coerce Excel / mixed cell values to strings for a uniform string[][]. */
export function coerceGridToStrings(grid: unknown[][]): string[][] {
  return grid.map((row) =>
    (Array.isArray(row) ? row : []).map((cell) => {
      if (cell == null || cell === '') return ''
      if (cell instanceof Date) return cell.toISOString()
      if (typeof cell === 'number' || typeof cell === 'boolean') return String(cell)
      return String(cell).trim()
    }),
  )
}

/** Escape and join a grid for the same CSV pipeline preview/commit already use. */
export function gridToCsv(grid: string[][]): string {
  return grid
    .map((row) =>
      row
        .map((cell) => {
          const s = cell ?? ''
          if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
          return s
        })
        .join(','),
    )
    .join('\n')
}

export function parseCsvRows(text: string): string[][] {
  const s = text.replace(/^\uFEFF/, '')
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  const pushField = () => {
    row.push(field)
    field = ''
  }
  const pushRow = () => {
    rows.push(row)
    row = []
  }

  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      pushField()
    } else if (c === '\n') {
      pushField()
      pushRow()
    } else if (c === '\r') {
      // ignore; \r\n handled by \n
    } else {
      field += c
    }
  }
  pushField()
  if (row.length > 1 || (row.length === 1 && row[0].trim() !== '')) {
    pushRow()
  }

  while (rows.length && rows[rows.length - 1].every((cell) => cell.trim() === '')) {
    rows.pop()
  }
  return rows
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, ' ')
}

function pickColumnIndex(headers: string[], candidates: string[]): number {
  const norm = headers.map(normalizeHeader)
  for (const cand of candidates) {
    const c = normalizeHeader(cand)
    const idx = norm.indexOf(c)
    if (idx !== -1) return idx
  }
  return -1
}

export function resolveHeaderIndices(headerRow: string[]) {
  const headers = headerRow.map((h) => h.trim())
  return {
    name: pickColumnIndex(headers, ['name', 'gym name', 'gym_name', 'title', 'gym']),
    address: pickColumnIndex(headers, ['address', 'street', 'full address', 'location address']),
    google_maps_link: pickColumnIndex(headers, [
      'google_maps_link',
      'google maps link',
      'google maps',
      'google_maps',
      'maps link',
      'maps url',
      'maps',
      'google location',
      'location url',
      'map url',
      'google url',
    ]),
    city: pickColumnIndex(headers, ['city', 'town']),
    country: pickColumnIndex(headers, ['country', 'nation']),
    disciplines: pickColumnIndex(headers, [
      'disciplines',
      'discipline',
      'sports',
      'sport',
      'training',
      'styles',
    ]),
    accommodation: pickColumnIndex(headers, [
      'accommodation',
      'offers accommodation',
      'offers_accommodation',
      'stays',
      'lodging',
    ]),
  }
}

function parseYesNoLoose(raw: string): boolean | null {
  const t = raw.trim().toLowerCase()
  if (!t) return null
  if (['yes', 'y', 'true', '1', 'on'].includes(t)) return true
  if (['no', 'n', 'false', '0', 'off'].includes(t)) return false
  return null
}

export function buildParsedRowsFromGrid(
  grid: string[][],
  defaultCountry: string,
): { rows: BulkImportParsedRow[]; header_error?: string } {
  if (grid.length < 2) {
    return {
      rows: [],
      header_error: 'The file must include a header row and at least one data row.',
    }
  }
  const [header, ...body] = grid
  const idx = resolveHeaderIndices(header)
  if (idx.name === -1) {
    return {
      rows: [],
      header_error:
        'Missing required column "name" (aliases: gym name, gym_name, title). Check the header row.',
    }
  }
  if (idx.city === -1) {
    return { rows: [], header_error: 'Missing required column "city". Check the header row.' }
  }
  const defaultNorm = normalizeCountryLabel(defaultCountry.trim())
  if (!defaultNorm.country && idx.country === -1) {
    return {
      rows: [],
      header_error:
        'Country is required for every row: add a "country" column or set a non-empty default country.',
    }
  }

  const rows: BulkImportParsedRow[] = []
  let dataRowIndex = 0
  for (let r = 0; r < body.length; r++) {
    const line = body[r]
    if (line.every((c) => c.trim() === '')) continue
    dataRowIndex++
    if (dataRowIndex > BULK_IMPORT_MAX_ROWS) {
      return {
        rows: [],
        header_error: `Too many data rows (max ${BULK_IMPORT_MAX_ROWS}). Split into multiple files.`,
      }
    }

    const name = (line[idx.name] ?? '').trim()
    const city = (line[idx.city] ?? '').trim()
    const mapsRaw = idx.google_maps_link === -1 ? '' : (line[idx.google_maps_link] ?? '').trim()
    const google_maps_link = mapsRaw ? mapsRaw : null
    const countryCell = idx.country === -1 ? '' : (line[idx.country] ?? '').trim()
    const sportsRaw = idx.disciplines === -1 ? '' : (line[idx.disciplines] ?? '').trim()
    const addressRaw = idx.address === -1 ? '' : (line[idx.address] ?? '').trim()
    const address = addressRaw ? normalizeWhitespace(addressRaw) : null
    const accommodationRaw =
      idx.accommodation === -1 ? '' : (line[idx.accommodation] ?? '').trim()

    const errors: string[] = []
    if (!name) errors.push('Gym name is empty.')
    if (!city) errors.push('City is empty.')

    let country = countryCell
    if (!country) {
      country = defaultNorm.country
    } else {
      const n = normalizeCountryLabel(countryCell)
      country = n.country
      if (n.error) errors.push(n.error)
    }
    if (!country) errors.push('Country is empty (column and default are blank).')

    const { disciplines, unknown_tokens } = mapDisciplineCell(sportsRaw)
    if (unknown_tokens.length) {
      errors.push(`Unknown sport tokens (map or remove): ${unknown_tokens.join(', ')}`)
    }
    if (disciplines.length === 0 && !sportsRaw.trim()) {
      errors.push('Sports / disciplines cell is empty.')
    }

    let offers_accommodation = false
    if (accommodationRaw) {
      const yn = parseYesNoLoose(accommodationRaw)
      if (yn === null) {
        errors.push(
          `Invalid accommodation value "${accommodationRaw}" — use Yes/No (or leave blank for No).`,
        )
      } else {
        offers_accommodation = yn
      }
    }

    rows.push({
      rowIndex: r + 2,
      name: normalizeWhitespace(name),
      address,
      city: normalizeWhitespace(city),
      country,
      google_maps_link,
      disciplines,
      offers_accommodation,
      sports_raw: sportsRaw,
      errors,
      duplicate_matches: [],
    })
  }

  return { rows }
}

export function attachDuplicates(
  rows: BulkImportParsedRow[],
  catalog: BulkGymCatalogEntry[],
): BulkImportParsedRow[] {
  return rows.map((row) => ({
    ...row,
    duplicate_matches: row.errors.length
      ? []
      : findDuplicateMatches(
          {
            name: row.name,
            city: row.city,
            country: row.country,
            google_maps_link: row.google_maps_link,
          },
          catalog,
        ),
  }))
}

export function resolutionValidForRow(
  row: BulkImportParsedRow,
  res: BulkImportRowResolution,
): string | null {
  if (res.row_index !== row.rowIndex) return 'Row index mismatch.'
  const dups = row.duplicate_matches
  const dupIds = new Set(dups.map((d) => d.gym.id))

  if (dups.length === 0) {
    if (res.action === 'update') return 'This row has no duplicate; use create or skip.'
    if (res.action === 'create_anyway') return 'create_anyway is only for duplicate rows.'
    return null
  }

  if (res.action === 'skip') return null
  if (res.action === 'create_anyway') return null
  if (res.action === 'create') {
    return 'This row matches an existing gym. Choose skip, update existing gym, or create_anyway.'
  }
  if (res.action === 'update') {
    if (!res.existing_gym_id) return 'Update requires existing_gym_id.'
    if (!dupIds.has(res.existing_gym_id)) {
      return 'existing_gym_id must be one of the duplicate matches for this row.'
    }
    return null
  }
  return 'Invalid action.'
}
