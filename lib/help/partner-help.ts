import type { SupportPageLink } from '@/lib/help/support-pages'

export type PartnerHelpCategoryId =
  | 'listings'
  | 'bookings'
  | 'payouts'
  | 'promotions'
  | 'account'
  | 'support'

export type PartnerHelpFaq = {
  id: string
  question: string
  answer: string
  category: PartnerHelpCategoryId
}

export const PARTNER_HELP_CATEGORIES: Array<{
  id: PartnerHelpCategoryId
  label: string
}> = [
  { id: 'listings', label: 'Listings & verification' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'payouts', label: 'Payouts' },
  { id: 'promotions', label: 'Promotions' },
  { id: 'account', label: 'Account & security' },
  { id: 'support', label: 'Support' },
]

export const PARTNER_HELP_FAQS: PartnerHelpFaq[] = [
  {
    id: 'partner-listing-live',
    category: 'listings',
    question: 'How do I get my gym live on CombatStay?',
    answer:
      'Finish your listing profile—photos, packages and pricing, and your preferred payout method under Settings → Payouts—then work through verification (location details, social links, and payout readiness). Some listings are reviewed before they appear in search; status is shown in the Partner Hub.',
  },
  {
    id: 'partner-listing-draft',
    category: 'listings',
    question: 'Why does my listing show as Draft?',
    answer:
      'Draft means the listing is not fully verified or not yet approved. Open Verification for the checklist, complete each step, then wait for admin approval if required.',
  },
  {
    id: 'partner-listing-edit',
    category: 'listings',
    question: 'How do I edit my public gym page?',
    answer:
      'Use Edit gym for details and photos, and View listing to preview how travelers see your gym before it is public.',
  },
  {
    id: 'partner-listing-fees',
    category: 'listings',
    question: 'Will I need to pay any fees during sign-up?',
    answer:
      'No. Signing up and creating your listing is free — no setup fees and no monthly cost. CombatStay charges a platform fee only when you receive a confirmed booking.',
  },
  {
    id: 'partner-bookings-inbox',
    category: 'bookings',
    question: 'Where do I see booking requests?',
    answer:
      'Open Bookings in the Partner Hub sidebar. Accept or decline inbound requests there. After a guest pays, updates and next steps show on each booking row.',
  },
  {
    id: 'partner-bookings-damage',
    category: 'bookings',
    question: 'What happens if my gym is damaged by a guest?',
    answer:
      'Guests agree to our Terms when they book, including responsibility for damage during their stay. Contact support as soon as possible with photos and details — include your booking reference so we can help quickly.',
  },
  {
    id: 'partner-payouts-how',
    category: 'payouts',
    question: 'How do payouts work?',
    answer:
      'Guests pay through CombatStay; your share is paid out through the method you choose under Settings → Payouts. You may complete identity and bank verification in a secure hosted flow — the Partner Hub shows status and balances once that is done. Only your net earnings are transferred to you.',
  },
  {
    id: 'partner-payouts-timing',
    category: 'payouts',
    question: 'When does CombatStay pay my gym?',
    answer:
      'Under partner terms, gyms are typically paid within three business days after a guest successfully checks in, subject to any dispute or investigation. Payout timing also depends on your payout provider completing verification.',
  },
  {
    id: 'partner-promotions',
    category: 'promotions',
    question: 'How do promotions work on CombatStay?',
    answer:
      'Open Promotions in the Partner Hub to create percentage discounts from templates or build your own. Active promotions apply to matching bookings automatically — no promo codes required. Edit packages and pricing under Edit gym if you need to adjust base rates first.',
  },
  {
    id: 'partner-account-security',
    category: 'account',
    question: 'How do I secure my owner account?',
    answer:
      'In Settings → Security, enable two-factor authentication, use a strong password, and use “Sign out of all devices” if you suspect unauthorized access.',
  },
  {
    id: 'partner-support-contact',
    category: 'support',
    question: 'Who do I contact for partner support?',
    answer:
      'Use Customer service and mention you are a gym partner, or email from the address on your Partner Hub account. For traveler-facing policies (cancellations guests see at checkout), see the public FAQ & Help Center.',
  },
]

export const PARTNER_HELP_FAQ_SCHEMA = PARTNER_HELP_FAQS.map((faq) => ({
  q: faq.question,
  a: faq.answer,
}))

export const PARTNER_SUPPORT_HUB_PAGES: SupportPageLink[] = [
  {
    href: '/owners/help',
    label: 'Partner FAQ',
    description: 'Listings, bookings, payouts, and promotions',
  },
  {
    href: '/manage/help',
    label: 'Partner Hub help',
    description: 'Same answers inside your dashboard',
  },
  {
    href: '/owners',
    label: 'List your gym',
    description: 'How partnering with CombatStay works',
  },
  {
    href: '/manage',
    label: 'Partner Hub',
    description: 'Sign in to manage bookings and payouts',
  },
  {
    href: '/contact?intent=partner',
    label: 'Partner support',
    description: 'Message our team about your listing or payouts',
  },
  {
    href: '/terms',
    label: 'Terms & Conditions',
    description: 'Partner recovery and booking rules',
  },
]

export function partnerHelpCategoryPath(category: PartnerHelpCategoryId): string {
  return `/owners/help/${category}`
}
