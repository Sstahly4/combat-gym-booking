/**
 * Normalize owner-entered discipline strings so we only show gyms that truly
 * list the target sport (not accidental OR-query matches).
 */
export function gymListsDiscipline(
  gymDisciplines: string[] | null | undefined,
  target: 'Muay Thai' | 'MMA' | 'BJJ' | 'Boxing' | 'Kickboxing' | 'Judo'
): boolean {
  if (!gymDisciplines || gymDisciplines.length === 0) return false

  const normalized = gymDisciplines.map((d) => d.toLowerCase().trim())

  if (target === 'Muay Thai') {
    return normalized.some(
      (d) =>
        d.includes('muay') ||
        d.includes('muaythai') ||
        d === 'mt' ||
        d.includes('thai boxing')
    )
  }

  if (target === 'MMA') {
    return normalized.some(
      (d) =>
        d === 'mma' ||
        d.includes('mixed martial') ||
        d.includes('mixed-martial') ||
        (d.includes('mma') && !d.includes('muay'))
    )
  }

  if (target === 'BJJ') {
    return normalized.some(
      (d) =>
        d.includes('bjj') ||
        d.includes('jiu') ||
        d.includes('jiu-jitsu') ||
        d.includes('jiujitsu') ||
        d.includes('brazilian') ||
        d.includes('no-gi') ||
        d.includes('nogi')
    )
  }

  if (target === 'Boxing') {
    return normalized.some(
      (d) => d.includes('boxing') || d.includes('boxer') || d === 'box'
    )
  }

  if (target === 'Kickboxing') {
    return normalized.some(
      (d) =>
        d.includes('kickboxing') ||
        d.includes('kick boxing') ||
        d.includes('k-1') ||
        d === 'kb'
    )
  }

  if (target === 'Judo') {
    return normalized.some((d) => d.includes('judo'))
  }

  return false
}
