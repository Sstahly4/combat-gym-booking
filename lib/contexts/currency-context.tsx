'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Currency = string

interface CurrencyContextType {
  selectedCurrency: Currency
  setSelectedCurrency: (currency: Currency) => void
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

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [selectedCurrency, setSelectedCurrencyState] = useState<Currency>('USD')
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
    // Load from localStorage
    const saved = localStorage.getItem('selectedCurrency')
    if (saved && (exchangeRates[saved] || FALLBACK_RATES[saved])) {
      setSelectedCurrencyState(saved)
    }
  }, [exchangeRates])

  const setSelectedCurrency = (currency: Currency) => {
    setSelectedCurrencyState(currency)
    localStorage.setItem('selectedCurrency', currency)
  }

  const convertPrice = (amount: number, fromCurrency: string): number => {
    if (!fromCurrency || !exchangeRates[fromCurrency]) return amount
    if (selectedCurrency === fromCurrency) return amount

    // Convert to USD first, then to target currency
    const usdAmount = amount / exchangeRates[fromCurrency]
    const targetAmount = usdAmount * exchangeRates[selectedCurrency]
    
    return Math.round(targetAmount * 100) / 100 // Round to 2 decimals
  }

  const formatPrice = (amount: number, currency?: string): string => {
    const curr = currency || selectedCurrency
    const formatted = amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return `${curr} ${formatted}`
  }

  return (
    <CurrencyContext.Provider value={{ 
      selectedCurrency, 
      setSelectedCurrency, 
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
