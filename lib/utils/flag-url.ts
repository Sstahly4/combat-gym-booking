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

export function getFlagUrl(lang: string): string | null {
  const code = getFlagCountryCode(lang)
  return code ? `https://flagcdn.com/w40/${code}.webp` : null
}
