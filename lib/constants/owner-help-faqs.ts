/** Owner / gym dashboard help — also summarized on `/manage/help`. */

export type OwnerHelpFaq = {
  id: string
  question: string
  answer: string
}

export const OWNER_HELP_FAQS: OwnerHelpFaq[] = [
  {
    id: 'owner-1',
    question: 'How do I get my gym live on CombatStay?',
    answer:
      'Finish your listing profile—photos, packages and pricing, and your preferred payout method under Settings → Payouts—then work through verification (for example location details, social links, and payout readiness). Some listings are reviewed by our team before they appear in search; you will see status in the Partner Hub.',
  },
  {
    id: 'owner-2',
    question: 'Where do I see booking requests?',
    answer:
      'Open Bookings in the left sidebar. You can accept or decline inbound requests there. After a guest pays, updates and next steps show on each booking—use the status and any prompts on that row so you know when to prepare for the stay.',
  },
  {
    id: 'owner-3',
    question: 'How do payouts work?',
    answer:
      'Guests pay through CombatStay; your host share is paid out through the preferred payout method you choose for each listing under Settings → Payouts. Depending on the method, you may complete identity and bank verification in a secure, hosted flow—your Partner Hub shows status and balances once that is done. The platform keeps its service fee; only your net earnings are transferred to you. Available payout methods can evolve over time; your settings page always lists what your listing can use today.',
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
