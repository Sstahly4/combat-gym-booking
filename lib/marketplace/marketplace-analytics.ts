/** Days from asOf (search/booking moment) to intended check-in. */
export function searchLeadTimeDays(
  startDateYmd: string | null | undefined,
  asOf = new Date(),
): number | null {
  if (!startDateYmd?.trim()) return null
  const start = new Date(`${startDateYmd.trim()}T12:00:00`)
  if (Number.isNaN(start.getTime())) return null
  const now = new Date(asOf)
  now.setHours(12, 0, 0, 0)
  return Math.max(0, Math.floor((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
}

export type FighterProfileSnapshot = {
  home_country: string | null
  home_location: string | null
  combat_skill_level: string | null
  combat_primary_discipline: string | null
  combat_disciplines: string[] | null
}

export function buildFighterProfileSnapshot(profile: {
  home_country?: string | null
  country_of_residence?: string | null
  home_location?: string | null
  combat_skill_level?: string | null
  combat_primary_discipline?: string | null
  combat_disciplines?: string[] | null
} | null): FighterProfileSnapshot | null {
  if (!profile) return null
  const homeCountry =
    profile.home_country?.trim() || profile.country_of_residence?.trim() || null
  const hasAny =
    homeCountry ||
    profile.home_location ||
    profile.combat_skill_level ||
    profile.combat_primary_discipline ||
    (Array.isArray(profile.combat_disciplines) && profile.combat_disciplines.length > 0)
  if (!hasAny) return null
  return {
    home_country: homeCountry,
    home_location: profile.home_location?.trim() || null,
    combat_skill_level: profile.combat_skill_level ?? null,
    combat_primary_discipline: profile.combat_primary_discipline?.trim() || null,
    combat_disciplines:
      Array.isArray(profile.combat_disciplines) && profile.combat_disciplines.length > 0
        ? profile.combat_disciplines
        : null,
  }
}
