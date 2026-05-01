import { BookingProvider } from '@/lib/contexts/booking-context'

export default function SavedLayout({ children }: { children: React.ReactNode }) {
  return <BookingProvider>{children}</BookingProvider>
}
