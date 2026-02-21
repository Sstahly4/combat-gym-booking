'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Package } from '@/lib/types/database'

const SESSION_CHECKIN  = 'booking_checkin'
const SESSION_CHECKOUT = 'booking_checkout'

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
  // Default dates: today → tomorrow (1 night)
  const getDefaultDates = () => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    return {
      checkin:  today.toISOString().split('T')[0],
      checkout: tomorrow.toISOString().split('T')[0],
    }
  }

  const defaults = getDefaultDates()

  // Initialise state — URL params take priority, then fall back to defaults.
  // Session-stored dates are loaded after mount via useEffect to avoid SSR
  // hydration mismatches.
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [checkin,  setCheckinState]  = useState(initialCheckin  || defaults.checkin)
  const [checkout, setCheckoutState] = useState(initialCheckout || defaults.checkout)
  const [guestCount, setGuestCount]  = useState(1)

  // On mount: if no URL params were provided (homepage), restore from sessionStorage.
  useEffect(() => {
    if (!initialCheckin && !initialCheckout) {
      const savedCheckin  = sessionStorage.getItem(SESSION_CHECKIN)
      const savedCheckout = sessionStorage.getItem(SESSION_CHECKOUT)
      if (savedCheckin && savedCheckout) {
        // Discard saved dates if check-in has already passed
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const checkinDate = new Date(savedCheckin + 'T00:00:00')
        if (checkinDate >= today) {
          setCheckinState(savedCheckin)
          setCheckoutState(savedCheckout)
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When URL params are provided (gym detail page), also persist them so the
  // homepage shows those dates if the user navigates back.
  useEffect(() => {
    if (initialCheckin && initialCheckout) {
      sessionStorage.setItem(SESSION_CHECKIN,  initialCheckin)
      sessionStorage.setItem(SESSION_CHECKOUT, initialCheckout)
    }
  }, [initialCheckin, initialCheckout])

  // Wrapped setters that keep sessionStorage in sync
  const setCheckin = (date: string) => {
    setCheckinState(date)
    if (date) {
      sessionStorage.setItem(SESSION_CHECKIN, date)
    } else {
      sessionStorage.removeItem(SESSION_CHECKIN)
    }
  }

  const setCheckout = (date: string) => {
    setCheckoutState(date)
    if (date) {
      sessionStorage.setItem(SESSION_CHECKOUT, date)
    } else {
      sessionStorage.removeItem(SESSION_CHECKOUT)
    }
  }

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
