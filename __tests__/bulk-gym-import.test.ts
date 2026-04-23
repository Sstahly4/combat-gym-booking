import { describe, expect, it } from 'vitest'
import {
  attachDuplicates,
  buildParsedRowsFromGrid,
  findDuplicateMatches,
  gridToCsv,
  mapDisciplineCell,
  normalizeCountryLabel,
  normalizeGoogleMapsFingerprint,
  parseCsvRows,
  resolutionValidForRow,
  toCatalogEntry,
  type BulkGymCatalogEntry,
  type BulkImportParsedRow,
} from '@/lib/admin/bulk-gym-import'

describe('parseCsvRows', () => {
  it('parses simple rows and strips BOM', () => {
    const grid = parseCsvRows('\uFEFFname,city\nFoo,Bar\n')
    expect(grid).toEqual([
      ['name', 'city'],
      ['Foo', 'Bar'],
    ])
  })

  it('handles quoted commas', () => {
    const grid = parseCsvRows('a,b\n"hello, world",x\n')
    expect(grid[1]).toEqual(['hello, world', 'x'])
  })
})

describe('normalizeGoogleMapsFingerprint', () => {
  it('uses place_id when present', () => {
    const a = normalizeGoogleMapsFingerprint(
      'https://www.google.com/maps?place_id=ChIJxxx&utm_source=x',
    )
    const b = normalizeGoogleMapsFingerprint(
      'https://google.com/maps?place_id=ChIJxxx&fbclid=1',
    )
    expect(a).toBe('place:ChIJxxx')
    expect(b).toBe('place:ChIJxxx')
  })
})

describe('mapDisciplineCell', () => {
  it('maps aliases and preserves canonical casing', () => {
    const r = mapDisciplineCell('mma, BJJ, muay thai')
    expect(r.disciplines).toEqual(['MMA', 'BJJ', 'Muay Thai'])
    expect(r.unknown_tokens).toEqual([])
  })

  it('collects unknown tokens', () => {
    const r = mapDisciplineCell('MMA, underwater hockey')
    expect(r.disciplines).toEqual(['MMA'])
    expect(r.unknown_tokens).toEqual(['underwater hockey'])
  })

  it('maps grappling to BJJ', () => {
    const r = mapDisciplineCell('BJJ, Grappling')
    expect(r.disciplines).toEqual(['BJJ'])
    expect(r.unknown_tokens).toEqual([])
  })
})

describe('gridToCsv', () => {
  it('round-trips through parseCsvRows when no special chars', () => {
    const grid = [
      ['name', 'city'],
      ['A', 'B'],
    ]
    const csv = gridToCsv(grid)
    expect(parseCsvRows(csv)).toEqual(grid)
  })
})

describe('normalizeCountryLabel', () => {
  it('expands TH to Thailand', () => {
    expect(normalizeCountryLabel('th').country).toBe('Thailand')
  })

  it('keeps unknown ISO with error', () => {
    const r = normalizeCountryLabel('zz')
    expect(r.country).toBe('zz')
    expect(r.error).toBeDefined()
  })
})

describe('duplicate detection', () => {
  const catalog: BulkGymCatalogEntry[] = [
    toCatalogEntry({
      id: 'g1',
      name: 'Tiger Gym',
      city: 'Bangkok',
      country: 'Thailand',
      google_maps_link: 'https://www.google.com/maps?place_id=ABC',
      disciplines: ['MMA'],
      verification_status: 'draft',
    }),
  ]

  it('matches by maps fingerprint', () => {
    const m = findDuplicateMatches(
      {
        name: 'Other Name',
        city: 'Chiang Mai',
        country: 'Thailand',
        google_maps_link: 'https://google.com/maps?place_id=ABC&utm_medium=email',
      },
      catalog,
    )
    expect(m).toHaveLength(1)
    expect(m[0].tier).toBe('maps')
    expect(m[0].gym.id).toBe('g1')
  })

  it('matches by identity when maps differ', () => {
    const m = findDuplicateMatches(
      {
        name: 'Tiger Gym',
        city: 'Bangkok',
        country: 'Thailand',
        google_maps_link: null,
      },
      catalog,
    )
    expect(m).toHaveLength(1)
    expect(m[0].tier).toBe('identity')
  })
})

describe('resolutionValidForRow', () => {
  const baseRow = (over: Partial<BulkImportParsedRow>): BulkImportParsedRow => ({
    rowIndex: 2,
    name: 'A',
    address: null,
    city: 'B',
    country: 'Thailand',
    google_maps_link: null,
    disciplines: ['MMA'],
    offers_accommodation: false,
    sports_raw: 'MMA',
    errors: [],
    duplicate_matches: [],
    ...over,
  })

  it('allows create when no duplicate', () => {
    expect(resolutionValidForRow(baseRow({}), { row_index: 2, action: 'create' })).toBeNull()
  })

  it('rejects create when duplicate', () => {
    const row = baseRow({
      duplicate_matches: [
        {
          tier: 'identity',
          gym: {
            id: 'x',
            name: 'A',
            address: null,
            city: 'B',
            country: 'Thailand',
            google_maps_link: null,
            disciplines: [],
            verification_status: 'draft',
          },
        },
      ],
    })
    expect(resolutionValidForRow(row, { row_index: 2, action: 'create' })).not.toBeNull()
    expect(resolutionValidForRow(row, { row_index: 2, action: 'create_anyway' })).toBeNull()
    expect(
      resolutionValidForRow(row, { row_index: 2, action: 'update', existing_gym_id: 'x' }),
    ).toBeNull()
  })
})

describe('buildParsedRowsFromGrid + attachDuplicates', () => {
  it('parses headers and attaches duplicates', () => {
    const grid = parseCsvRows(
      'name,city,country,google_maps_link,disciplines\nTiger Gym,Bangkok,Thailand,,MMA\n',
    )
    const { rows, header_error } = buildParsedRowsFromGrid(grid, '')
    expect(header_error).toBeUndefined()
    expect(rows).toHaveLength(1)
    const cat: BulkGymCatalogEntry[] = [
      toCatalogEntry({
        id: 'g1',
        name: 'Tiger Gym',
        city: 'Bangkok',
        country: 'Thailand',
        google_maps_link: null,
        disciplines: [],
        verification_status: 'draft',
      }),
    ]
    const withDup = attachDuplicates(rows, cat)
    expect(withDup[0].duplicate_matches.length).toBeGreaterThan(0)
  })

  it('reads address and accommodation from prospect-style headers', () => {
    const grid = parseCsvRows(
      'name,address,city,sports,accommodation\nTest Gym,1 Main St,Bangkok,Muay Thai,Yes\n',
    )
    const { rows, header_error } = buildParsedRowsFromGrid(grid, 'Thailand')
    expect(header_error).toBeUndefined()
    expect(rows[0].address).toBe('1 Main St')
    expect(rows[0].offers_accommodation).toBe(true)
  })
})
