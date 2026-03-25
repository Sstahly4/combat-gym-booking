import { NextRequest, NextResponse } from 'next/server'

// Cache exchange rates for 1 hour (3600 seconds)
const CACHE_DURATION = 3600
let cachedRates: { rates: Record<string, number>; timestamp: number } | null = null

export async function GET(request: NextRequest) {
  try {
    // Check cache first
    if (cachedRates && Date.now() - cachedRates.timestamp < CACHE_DURATION * 1000) {
      return NextResponse.json({ 
        success: true, 
        rates: cachedRates.rates,
        cached: true 
      })
    }

    // Fetch from exchangerate-api.com (free tier: 1,500 requests/month)
    // No API key needed for free tier
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      next: { revalidate: 3600 } // Revalidate every hour
    })

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates')
    }

    const data = await response.json()

    // Transform the rates object to match our format
    const rates: Record<string, number> = {
      USD: 1,
      ...data.rates
    }

    // Cache the rates
    cachedRates = {
      rates,
      timestamp: Date.now()
    }

    return NextResponse.json({ 
      success: true, 
      rates,
      cached: false 
    })
  } catch (error) {
    console.error('Error fetching exchange rates:', error)
    
    // Fallback to hardcoded rates if API fails
    const fallbackRates: Record<string, number> = {
      USD: 1,
      THB: 35.5,
      AUD: 1.52,
      IDR: 15750,
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

    return NextResponse.json({ 
      success: false, 
      rates: fallbackRates,
      error: 'Using fallback rates',
      cached: false 
    })
  }
}
