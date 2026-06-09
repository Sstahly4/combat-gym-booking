const LANGUAGE_COUNTRY_CODES: Record<string, string> = {
  'en-AU': 'au',
  'en-GB': 'gb',
  'en-US': 'us',
  en: 'us',
  th: 'th',
  'th-TH': 'th',
  zh: 'cn',
  'zh-CN': 'cn',
  'zh-TW': 'tw',
  ja: 'jp',
  ko: 'kr',
  de: 'de',
  fr: 'fr',
  es: 'es',
  pt: 'br',
  'pt-BR': 'br',
  ru: 'ru',
  ar: 'sa',
}

function getFlagCountryCode(lang: string): string | null {
  const code =
    LANGUAGE_COUNTRY_CODES[lang] ?? LANGUAGE_COUNTRY_CODES[lang.split('-')[0]]
  if (code) return code

  const region = lang.split('-')[1]?.toLowerCase()
  if (region && /^[a-z]{2}$/.test(region)) return region

  return null
}

/** Matches the sandwich-menu flag circle (`w-10` = 40px). */
export const FLAG_MENU_DISPLAY_PX = 40

export function getFlagUrl(lang: string): string | null {
  const code = getFlagCountryCode(lang)
  if (!code) return null
  // flagcdn `w` sets width; height is half (2:1) — never stretch into the square circle.
  // Serve 2× width for retina so a 40px circle stays sharp on mobile.
  return `https://flagcdn.com/w${FLAG_MENU_DISPLAY_PX * 2}/${code}.webp`
}

export function getFlagSrcSet(lang: string): string | null {
  const code = getFlagCountryCode(lang)
  if (!code) return null
  const w = FLAG_MENU_DISPLAY_PX
  return `https://flagcdn.com/w${w}/${code}.webp 1x, https://flagcdn.com/w${w * 2}/${code}.webp 2x`
}
