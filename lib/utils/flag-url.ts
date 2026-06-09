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

const CIRCLE_FLAG_CDN = 'https://hatscripts.github.io/circle-flags/flags'

/**
 * Round flag SVG for the sandwich-menu circle (HatScripts circle-flags).
 * Asset is circular — render at `h-full w-full` inside a square container.
 */
export function getFlagUrl(lang: string): string | null {
  const code = getFlagCountryCode(lang)
  if (!code) return null
  return `${CIRCLE_FLAG_CDN}/${code}.svg`
}
