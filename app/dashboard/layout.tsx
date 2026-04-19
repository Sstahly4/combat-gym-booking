import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Bookings | Combatbooking',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
