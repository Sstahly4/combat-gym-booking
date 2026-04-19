import type { Metadata } from 'next'
import BookingsListClient from './bookings-list-client'
import { memberHubPageTitle } from '@/lib/metadata/site-hubs'

export const metadata: Metadata = {
  title: memberHubPageTitle('My bookings'),
}

export default function BookingsListPage() {
  return <BookingsListClient />
}
