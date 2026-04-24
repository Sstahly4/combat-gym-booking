/**
 * Short section label for the browser tab inside the owner (partner) portal.
 * `/manage` uses the gym name + "Dashboard" in the shell instead.
 */
export function managePartnerSectionTitle(pathname: string): string {
  if (pathname.startsWith('/manage/onboarding')) return 'Onboarding'
  if (pathname.startsWith('/manage/security-onboarding')) return 'Security setup'
  if (pathname.startsWith('/manage/invite')) return 'Invite'
  if (pathname.startsWith('/manage/list-your-gym')) return 'List your gym'
  if (pathname.startsWith('/manage/bookings')) return 'Bookings'
  if (pathname.startsWith('/manage/upcoming-bookings')) return 'Upcoming bookings'
  if (pathname.startsWith('/manage/calendar')) return 'Calendar'
  if (pathname.startsWith('/manage/gym/edit')) return 'Edit listing'
  if (pathname.startsWith('/manage/gym/preview')) return 'Preview listing'
  if (pathname.startsWith('/manage/accommodation')) return 'Accommodation'
  if (pathname.startsWith('/manage/promotions')) return 'Promotions'
  if (pathname.startsWith('/manage/reviews')) return 'Reviews'
  if (pathname.startsWith('/manage/verification')) return 'Verification'
  if (pathname.startsWith('/manage/balances')) return 'Balances'
  if (pathname.startsWith('/manage/stripe-connect')) return 'Stripe Connect'
  if (pathname.startsWith('/manage/settings/security')) return 'Security settings'
  if (pathname.startsWith('/manage/settings/payouts')) return 'Payout settings'
  if (pathname.startsWith('/manage/settings/notifications')) return 'Notifications'
  if (pathname.startsWith('/manage/settings')) return 'Settings'
  if (pathname.startsWith('/manage/help')) return 'Help'
  return 'Partner'
}
