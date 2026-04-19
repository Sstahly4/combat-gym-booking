/** Owner / gym dashboard help — also summarized on `/manage/help`. */

export type OwnerHelpFaq = {
  id: string
  question: string
  answer: string
}

export const OWNER_HELP_FAQS: OwnerHelpFaq[] = [
  {
    id: 'owner-1',
    question: 'How do I get my gym live on CombatBooking?',
    answer:
      'Complete your gym profile (photos, packages, Stripe Connect), then finish verification: Google Maps link, social link, and Stripe payouts. Our team reviews listings before they appear in search.',
  },
  {
    id: 'owner-2',
    question: 'Where do I see booking requests?',
    answer:
      'Open Bookings in the left sidebar. You can accept or decline requests; payment flows depend on your Stripe Connect status.',
  },
  {
    id: 'owner-3',
    question: 'How do payouts work?',
    answer:
      'Connect Stripe under Payouts in Settings (same page). We sync status from Stripe. You must complete identity and bank details there before you can receive payouts.',
  },
  {
    id: 'owner-4',
    question: 'Why does my listing show as Draft?',
    answer:
      'Draft means the listing is not fully verified or not yet approved. Check Verification status for a checklist. Complete each step, then wait for admin approval if required.',
  },
  {
    id: 'owner-5',
    question: 'How do I edit my public gym page?',
    answer:
      'Use Edit gym for details and photos, and View listing to preview how travelers see your gym before it is public.',
  },
  {
    id: 'owner-6',
    question: 'How do I secure my owner account?',
    answer:
      'In Settings → Security (below), enable two-factor authentication, use a strong password, and use “Sign out of all devices” if you suspect unauthorized access.',
  },
  {
    id: 'owner-7',
    question: 'Who do I contact for support?',
    answer:
      'Email support from the contact page linked in the site footer, or use the full Help Center for travelers and general policies (opens in a new tab).',
  },
]
