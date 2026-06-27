/** Public support, policy, and self-service pages (footer + Help Center hub). */
export type SupportPageLink = {
  href: string
  label: string
  description: string
}

export const SUPPORT_HUB_PAGES: SupportPageLink[] = [
  {
    href: '/faq',
    label: 'FAQ & Help Center',
    description: 'Answers on bookings, payments, gyms, and safety',
  },
  {
    href: '/owners/help',
    label: 'Partner FAQ',
    description: 'Help for gym owners and the Partner Hub',
  },
  {
    href: '/how-it-works',
    label: 'How it works',
    description: 'Search, book, and train in four steps',
  },
  {
    href: '/contact',
    label: 'Customer service',
    description: 'Message our team about your booking or account',
  },
  {
    href: '/terms',
    label: 'Terms & Conditions',
    description: 'Booking rules, cancellations, and liability',
  },
  {
    href: '/privacy',
    label: 'Privacy Policy',
    description: 'How we collect and use your data',
  },
  {
    href: '/data-deletion',
    label: 'Delete your data',
    description: 'Request account and data removal',
  },
  {
    href: '/accessibility',
    label: 'Accessibility',
    description: 'Our commitment to an accessible platform',
  },
]

/** Plain-text FAQ entries for FAQPage JSON-LD (subset of on-page content). */
export const HELP_CENTER_FAQ_SCHEMA: Array<{ q: string; a: string }> = [
  {
    q: 'How do I modify or cancel my booking?',
    a: 'Message CombatStay customer service with your booking reference. Changes and refunds follow the package rules on your confirmation and what you accepted at checkout, including any free-cancellation window.',
  },
  {
    q: 'When will I be charged for my booking?',
    a: 'We usually place a temporary hold on your card at checkout. You are charged only after the free-cancellation deadline on your package, if there is one. Cancel before that time and the hold is released.',
  },
  {
    q: 'What happens to my money when I book?',
    a: 'When you book, we place a temporary hold on your card. After the gym confirms and your cancellation window closes, payment is captured and CombatStay appears on your statement. The gym is paid after your arrival.',
  },
  {
    q: 'Who charges my card?',
    a: 'CombatStay appears on your bank statement. We collect payment under the terms you accept at checkout. The gym delivers your training or stay as an independent partner.',
  },
  {
    q: 'What if the gym declines my booking?',
    a: 'You are not charged. We email you straight away and can suggest other gyms when possible. Your bank usually releases the hold within a few business days.',
  },
  {
    q: 'What if something is wrong when I arrive at the gym or accommodation?',
    a: 'Report material issues to CombatStay support within 48 hours of check-in to be eligible for a platform-mediated refund. After 48 hours, the booking is considered accepted.',
  },
  {
    q: 'What safety measures do gyms have in place?',
    a: 'Listed gyms must meet our standards: qualified coaches, suitable equipment, and basic emergency procedures. Combat sports training carries risk and you participate at your own risk.',
  },
  {
    q: 'What insurance coverage do I need?',
    a: 'Use travel insurance that covers medical emergencies, sports injury including combat sports, and trip changes. Confirm wording with your insurer as many standard policies exclude combat sports.',
  },
  {
    q: 'How do I delete my CombatStay account and data?',
    a: 'Request deletion through our data deletion page or contact form using the email on your account. We aim to complete verified requests within 30 days.',
  },
  {
    q: 'How do I access my booking without an account?',
    a: 'Use Manage your booking with your booking reference and PIN from your confirmation email, or tap the magic link in that email.',
  },
]
