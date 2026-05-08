function normalizeWhitespace(s: string): string {
  return s.trim().replace(/\s+/g, ' ')
}

/**
 * Kebab-case slug for city/suburb strings.
 * Mirrors the DB migration's “kebab-ish” intent but keeps it simple/stable in TS.
 */
export function locationToSlug(location: string): string {
  const s = normalizeWhitespace(location)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return s || 'unknown'
}

function titleCaseWord(w: string): string {
  if (!w) return w
  return w[0]!.toUpperCase() + w.slice(1)
}

/** Best-effort decoding for slugs into human-readable locations. */
export function slugToLocation(slug: string): string {
  const clean = normalizeWhitespace(slug.replace(/-/g, ' ')).replace(/[^a-zA-Z0-9\s]/g, '').trim()
  if (!clean) return 'Unknown'
  return clean
    .split(' ')
    .filter(Boolean)
    .map((w) => (/\d/.test(w) ? w : titleCaseWord(w.toLowerCase())))
    .join(' ')
}

