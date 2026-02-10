'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Currency = string

interface CurrencyContextType {
  selectedCurrency: Currency
  setSelectedCurrency: (currency: Currency) => void
  convertPrice: (amount: number, fromCurrency: string) => number
  formatPrice: (amount: number, currency?: string) => string
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

// Basic exchange rates (for MVP - in production, use a real API)
const EXCHANGE_RATES: Record<string, number> = {
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

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('selectedCurrency')
    if (saved && EXCHANGE_RATES[saved]) {
      setSelectedCurrencyState(saved)
    }
  }, [])

  const setSelectedCurrency = (currency: Currency) => {
    setSelectedCurrencyState(currency)
    localStorage.setItem('selectedCurrency', currency)
  }

  const convertPrice = (amount: number, fromCurrency: string): number => {
    if (!fromCurrency || !EXCHANGE_RATES[fromCurrency]) return amount
    if (selectedCurrency === fromCurrency) return amount

    // Convert to USD first, then to target currency
    const usdAmount = amount / EXCHANGE_RATES[fromCurrency]
    const targetAmount = usdAmount * EXCHANGE_RATES[selectedCurrency]
    
    return Math.round(targetAmount * 100) / 100 // Round to 2 decimals
  }

  const formatPrice = (amount: number, currency?: string): string => {
    const curr = currency || selectedCurrency
    const formatted = amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return `${curr} ${formatted}`
  }

  return (
    <CurrencyContext.Provider value={{ selectedCurrency, setSelectedCurrency, convertPrice, formatPrice }}>
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
