'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import type { Package } from '@/lib/types/database'

interface BookingContextType {
  selectedPackage: Package | null
  setSelectedPackage: (pkg: Package | null) => void
  checkin: string
  setCheckin: (date: string) => void
  checkout: string
  setCheckout: (date: string) => void
  guestCount: number
  setGuestCount: (count: number) => void
}

const BookingContext = createContext<BookingContextType | undefined>(undefined)

export function BookingProvider({ 
  children,
  initialCheckin = '',
  initialCheckout = ''
}: { 
  children: ReactNode
  initialCheckin?: string
  initialCheckout?: string
}) {
  // Default dates to 1 week from today if not provided (Booking.com style)
  const getDefaultDates = () => {
    if (initialCheckin && initialCheckout) {
      return { checkin: initialCheckin, checkout: initialCheckout }
    }
    const today = new Date()
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)
    
    return {
      checkin: today.toISOString().split('T')[0],
      checkout: nextWeek.toISOString().split('T')[0]
    }
  }

  const defaultDates = getDefaultDates()
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [checkin, setCheckin] = useState(initialCheckin || defaultDates.checkin)
  const [checkout, setCheckout] = useState(initialCheckout || defaultDates.checkout)
  const [guestCount, setGuestCount] = useState(1)

  return (
    <BookingContext.Provider value={{
      selectedPackage,
      setSelectedPackage,
      checkin,
      setCheckin,
      checkout,
      setCheckout,
      guestCount,
      setGuestCount,
    }}>
      {children}
    </BookingContext.Provider>
  )
}

export function useBooking() {
  const context = useContext(BookingContext)
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider')
  }
  return context
}