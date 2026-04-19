import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Bookings | Combatbooking',
}

export default function BookingsSectionLayout({ children }: { children: React.ReactNode }) {
  return children
}
