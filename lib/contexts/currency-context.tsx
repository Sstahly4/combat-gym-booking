'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Currency = string

interface CurrencyContextType {
  selectedCurrency: Currency
  setSelectedCurrency: (currency: Currency) => void
  selectedLanguage: string
  setSelectedLanguage: (language: string) => void
  convertPrice: (amount: number, fromCurrency: string) => number
  formatPrice: (amount: number, currency?: string) => string
  ratesLoading: boolean
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

// Fallback exchange rates (used if API fails)
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  THB: 35.5, // Thai Baht
  AUD: 1.52,
  IDR: 15750, // Indonesian Rupiah
  EUR: 0.92,
  GBP: 0.79,
  JPY: 150,
  CNY: 7.2,
  SGD: 1.35,
  MYR: 4.75,
  NZD: 1.65,
  CAD: 1.35,
  HKD: 7.8,
  INR: 83,
  KRW: 1330,
  PHP: 56,
  VND: 24500,
}

const CURRENCIES = [
  { code: 'USD', name: 'United States Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'Pound Sterling' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'THB', name: 'Thai Baht' },
  { code: 'IDR', name: 'Indonesian Rupiah' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'MYR', name: 'Malaysian Ringgit' },
  { code: 'NZD', name: 'New Zealand Dollar' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'HKD', name: 'Hong Kong Dollar' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'KRW', name: 'South Korean Won' },
  { code: 'PHP', name: 'Philippine Peso' },
  { code: 'VND', name: 'Vietnamese Dong' },
]

const SUPPORTED_CURRENCY_CODES = new Set(CURRENCIES.map((currency) => currency.code))

const REGION_CURRENCY_MAP: Record<string, string> = {
  AU: 'AUD',
  CA: 'CAD',
  CN: 'CNY',
  GB: 'GBP',
  HK: 'HKD',
  ID: 'IDR',
  IN: 'INR',
  JP: 'JPY',
  KR: 'KRW',
  MY: 'MYR',
  NZ: 'NZD',
  PH: 'PHP',
  SG: 'SGD',
  TH: 'THB',
  US: 'USD',
  VN: 'VND',
}

const EURO_REGIONS = new Set([
  'AT',
  'BE',
  'CY',
  'DE',
  'EE',
  'ES',
  'FI',
  'FR',
  'GR',
  'HR',
  'IE',
  'IT',
  'LT',
  'LU',
  'LV',
  'MT',
  'NL',
  'PT',
  'SI',
  'SK',
])

const TIMEZONE_CURRENCY_HINTS: Array<{ pattern: RegExp; currency: string }> = [
  { pattern: /^Asia\/Bangkok$/, currency: 'THB' },
  { pattern: /^Asia\/(Jakarta|Makassar|Jayapura|Pontianak)$/, currency: 'IDR' },
  { pattern: /^Asia\/Singapore$/, currency: 'SGD' },
  { pattern: /^Asia\/Kuala_Lumpur$/, currency: 'MYR' },
  { pattern: /^Asia\/Manila$/, currency: 'PHP' },
  { pattern: /^Asia\/Ho_Chi_Minh$/, currency: 'VND' },
  { pattern: /^Asia\/(Tokyo|Osaka)$/, currency: 'JPY' },
  { pattern: /^Asia\/Seoul$/, currency: 'KRW' },
  { pattern: /^Asia\/(Shanghai|Chongqing|Harbin|Urumqi)$/, currency: 'CNY' },
  { pattern: /^Asia\/Hong_Kong$/, currency: 'HKD' },
  { pattern: /^Asia\/(Kolkata|Calcutta)$/, currency: 'INR' },
  { pattern: /^Australia\//, currency: 'AUD' },
  { pattern: /^Pacific\/Auckland$/, currency: 'NZD' },
  { pattern: /^Europe\/(London|Jersey|Guernsey|Isle_of_Man)$/, currency: 'GBP' },
  { pattern: /^Europe\//, currency: 'EUR' },
  { pattern: /^America\/(Toronto|Vancouver|Montreal|Winnipeg|Edmonton|Halifax|St_Johns)$/, currency: 'CAD' },
  { pattern: /^America\//, currency: 'USD' },
]

function supportedCurrency(code: string | null | undefined): string | null {
  if (!code) return null
  const upper = code.toUpperCase()
  return SUPPORTED_CURRENCY_CODES.has(upper) ? upper : null
}

function currencyFromLocale(locale: string | null | undefined): string | null {
  if (!locale) return null
  let region: string | undefined
  try {
    region = new Intl.Locale(locale).region
  } catch {
    const match = locale.match(/[-_]([A-Za-z]{2})\b/)
    region = match?.[1]
  }
  if (!region) return null
  const upper = region.toUpperCase()
  if (EURO_REGIONS.has(upper)) return 'EUR'
  return supportedCurrency(REGION_CURRENCY_MAP[upper])
}

function currencyFromTimezone(timeZone: string | null | undefined): string | null {
  if (!timeZone) return null
  const hint = TIMEZONE_CURRENCY_HINTS.find((entry) => entry.pattern.test(timeZone))
  return supportedCurrency(hint?.currency)
}

function detectRegionalCurrency(): string | null {
  if (typeof window === 'undefined') return null
  const localeCurrency =
    currencyFromLocale(navigator.language) ||
    (Array.isArray(navigator.languages)
      ? navigator.languages.map(currencyFromLocale).find(Boolean) ?? null
      : null)
  if (localeCurrency) return localeCurrency

  try {
    return currencyFromTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  } catch {
    return null
  }
}

const LANGUAGES = [
  // English
  { code: 'en-AU', name: 'English', region: 'Australia' },
  { code: 'en-CA', name: 'English', region: 'Canada' },
  { code: 'en-GY', name: 'English', region: 'Guyana' },
  { code: 'en-IN', name: 'English', region: 'India' },
  { code: 'en-IE', name: 'English', region: 'Ireland' },
  { code: 'en-NZ', name: 'English', region: 'New Zealand' },
  { code: 'en-SG', name: 'English', region: 'Singapore' },
  { code: 'en-AE', name: 'English', region: 'United Arab Emirates' },
  { code: 'en-GB', name: 'English', region: 'United Kingdom' },
  { code: 'en-US', name: 'English', region: 'United States' },
  // Español
  { code: 'es-AR', name: 'Español', region: 'Argentina' },
  { code: 'es-BZ', name: 'Español', region: 'Belice' },
  { code: 'es-BO', name: 'Español', region: 'Bolivia' },
  { code: 'es-CL', name: 'Español', region: 'Chile' },
  { code: 'es-CO', name: 'Español', region: 'Colombia' },
  { code: 'es-CR', name: 'Español', region: 'Costa Rica' },
  { code: 'es-EC', name: 'Español', region: 'Ecuador' },
  { code: 'es-SV', name: 'Español', region: 'El Salvador' },
  { code: 'es-ES', name: 'Español', region: 'España' },
  { code: 'es-US', name: 'Español', region: 'Estados Unidos' },
  { code: 'es-GT', name: 'Español', region: 'Guatemala' },
  { code: 'es-HN', name: 'Español', region: 'Honduras' },
  { code: 'es-419', name: 'Español', region: 'Latinoamérica' },
  { code: 'es-MX', name: 'Español', region: 'México' },
  { code: 'es-NI', name: 'Español', region: 'Nicaragua' },
  { code: 'es-PA', name: 'Español', region: 'Panamá' },
  { code: 'es-PY', name: 'Español', region: 'Paraguay' },
  { code: 'es-PE', name: 'Español', region: 'Perú' },
  // Français
  { code: 'fr-BE', name: 'Français', region: 'Belgique' },
  { code: 'fr-CA', name: 'Français', region: 'Canada' },
  { code: 'fr-FR', name: 'Français', region: 'France' },
  { code: 'fr-LU', name: 'Français', region: 'Luxembourg' },
  { code: 'fr-CH', name: 'Français', region: 'Suisse' },
  // Deutsch
  { code: 'de-DE', name: 'Deutsch', region: 'Deutschland' },
  { code: 'de-LU', name: 'Deutsch', region: 'Luxemburg' },
  { code: 'de-AT', name: 'Deutsch', region: 'Österreich' },
  { code: 'de-CH', name: 'Deutsch', region: 'Schweiz' },
  // Other European
  { code: 'az-AZ', name: 'Azərbaycanca', region: 'Azərbaycan' },
  { code: 'id-ID', name: 'Bahasa Indonesia', region: 'Indonesia' },
  { code: 'ms-MY', name: 'Bahasa Melayu', region: 'Malaysia' },
  { code: 'bs-BA', name: 'Bosanski', region: 'Bosna i Hercegovina' },
  { code: 'ca-ES', name: 'Català', region: 'Espanya' },
  { code: 'hr-HR', name: 'Hrvatski', region: 'Hrvatska' },
  { code: 'cs-CZ', name: 'Čeština', region: 'Česká republika' },
  { code: 'me-ME', name: 'Crnogorski', region: 'Crna Gora' },
  { code: 'da-DK', name: 'Dansk', region: 'Danmark' },
  { code: 'et-EE', name: 'Eesti', region: 'Eesti' },
  { code: 'fi-FI', name: 'Suomi', region: 'Suomi' },
  { code: 'el-GR', name: 'Ελληνικά', region: 'Ελλάδα' },
  { code: 'it-IT', name: 'Italiano', region: 'Italia' },
  { code: 'lv-LV', name: 'Latviešu', region: 'Latvija' },
  { code: 'lt-LT', name: 'Lietuvių', region: 'Lietuva' },
  { code: 'hu-HU', name: 'Magyar', region: 'Magyarország' },
  { code: 'nl-BE', name: 'Nederlands', region: 'België' },
  { code: 'nl-NL', name: 'Nederlands', region: 'Nederland' },
  { code: 'no-NO', name: 'Norsk', region: 'Norge' },
  { code: 'pl-PL', name: 'Polski', region: 'Polska' },
  { code: 'pt-BR', name: 'Português', region: 'Brasil' },
  { code: 'pt-PT', name: 'Português', region: 'Portugal' },
  { code: 'ro-RO', name: 'Română', region: 'România' },
  { code: 'sk-SK', name: 'Slovenčina', region: 'Slovensko' },
  { code: 'sl-SI', name: 'Slovenščina', region: 'Slovenija' },
  { code: 'sr-RS', name: 'Srpski', region: 'Srbija' },
  { code: 'sv-SE', name: 'Svenska', region: 'Sverige' },
  { code: 'tr-TR', name: 'Türkçe', region: 'Türkiye' },
  { code: 'uk-UA', name: 'Українська', region: 'Україна' },
  // Asian
  { code: 'ja-JP', name: '日本語', region: '日本' },
  { code: 'ko-KR', name: '한국어', region: '대한민국' },
  { code: 'zh-CN', name: '简体中文', region: '中国大陆' },
  { code: 'zh-TW', name: '繁體中文', region: '台灣' },
  { code: 'th-TH', name: 'ภาษาไทย', region: 'ประเทศไทย' },
  { code: 'vi-VN', name: 'Tiếng Việt', region: 'Việt Nam' },
  { code: 'hi-IN', name: 'हिन्दी', region: 'भारत' },
  { code: 'ar-SA', name: 'العربية', region: 'المملكة العربية السعودية' },
  { code: 'he-IL', name: 'עברית', region: 'ישראל' },
]

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [selectedCurrency, setSelectedCurrencyState] = useState<Currency>('USD')
  const [selectedLanguage, setSelectedLanguageState] = useState<string>('en-GB')
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(FALLBACK_RATES)
  const [ratesLoading, setRatesLoading] = useState(true)

  // Fetch exchange rates on mount
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch('/api/currency/rates')
        const data = await response.json()
        
        if (data.success && data.rates) {
          setExchangeRates(data.rates)
        } else {
          // Use fallback if API fails
          setExchangeRates(FALLBACK_RATES)
        }
      } catch (error) {
        console.error('Failed to fetch exchange rates:', error)
        // Use fallback rates
        setExchangeRates(FALLBACK_RATES)
      } finally {
        setRatesLoading(false)
      }
    }

    fetchRates()

    // Refresh rates every hour
    const interval = setInterval(fetchRates, 3600000) // 1 hour

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Load from localStorage first; only auto-detect on the visitor's first session.
    const saved = localStorage.getItem('selectedCurrency')?.toUpperCase()
    if (saved && supportedCurrency(saved) && (exchangeRates[saved] || FALLBACK_RATES[saved])) {
      setSelectedCurrencyState(saved)
    } else {
      const regionalCurrency = detectRegionalCurrency()
      if (regionalCurrency && (exchangeRates[regionalCurrency] || FALLBACK_RATES[regionalCurrency])) {
        setSelectedCurrencyState(regionalCurrency)
        localStorage.setItem('selectedCurrency', regionalCurrency)
        localStorage.setItem('selectedCurrencySource', 'regional')
      }
    }
    const savedLanguage = localStorage.getItem('selectedLanguage')
    if (savedLanguage && LANGUAGES.some(language => language.code === savedLanguage)) {
      setSelectedLanguageState(savedLanguage)
    }
  }, [exchangeRates])

  const setSelectedCurrency = (currency: Currency) => {
    const code = currency.toUpperCase()
    setSelectedCurrencyState(code)
    localStorage.setItem('selectedCurrency', code)
    localStorage.setItem('selectedCurrencySource', 'manual')
  }

  const setSelectedLanguage = (language: string) => {
    setSelectedLanguageState(language)
    localStorage.setItem('selectedLanguage', language)
  }

  // Hint for accessibility / browser translation (UI copy is still English-only).
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.lang = selectedLanguage || 'en-GB'
  }, [selectedLanguage])

  const convertPrice = (amount: number, fromCurrency: string): number => {
    const from = (fromCurrency || 'USD').toUpperCase()
    const to = (selectedCurrency || 'USD').toUpperCase()
    if (!exchangeRates[from]) return amount
    if (to === from) return amount

    // Convert to USD first, then to target currency
    const usdAmount = amount / exchangeRates[from]
    const rateTo = exchangeRates[to]
    if (rateTo == null || !Number.isFinite(rateTo)) return amount
    const targetAmount = usdAmount * rateTo

    return Math.round(targetAmount * 100) / 100 // Round to 2 decimals
  }

  const formatPrice = (amount: number, currency?: string): string => {
    const curr = (currency || selectedCurrency).toUpperCase()
    const formatted = amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return `${curr} ${formatted}`
  }

  return (
    <CurrencyContext.Provider value={{ 
      selectedCurrency, 
      setSelectedCurrency, 
      selectedLanguage,
      setSelectedLanguage,
      convertPrice, 
      formatPrice,
      ratesLoading 
    }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    AUD: 'A$',
    THB: '฿',
    IDR: 'Rp',
    JPY: '¥',
    CNY: '¥',
    SGD: 'S$',
    MYR: 'RM',
    NZD: 'NZ$',
    CAD: 'C$',
    HKD: 'HK$',
    INR: '₹',
    KRW: '₩',
    PHP: '₱',
    VND: '₫',
  }
  return symbols[currency] || currency
}

export { CURRENCIES }
export { LANGUAGES }
