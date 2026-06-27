export type LegalDocNavItem = {
  href: string
  label: string
}

export const LEGAL_DOC_NAV: LegalDocNavItem[] = [
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/data-deletion', label: 'Delete your data' },
  { href: '/accessibility', label: 'Accessibility' },
]

export const LEGAL_HELP_LINKS: LegalDocNavItem[] = [
  { href: '/faq', label: 'Traveler FAQ' },
  { href: '/owners/help', label: 'Partner FAQ' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/contact', label: 'Customer service' },
]

export type LegalDocTocItem = {
  id: string
  label: string
}
