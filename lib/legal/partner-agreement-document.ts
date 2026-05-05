/**
 * Partner-facing agreement shown in onboarding Step 4 and embedded in the executed PDF.
 * Bump {@link CURRENT_PARTNER_AGREEMENT_VERSION} whenever this material changes so
 * owners who accepted an older version are prompted to re-accept.
 */
export const CURRENT_PARTNER_AGREEMENT_VERSION = '2026-02-05-v1'

export const PARTNER_AGREEMENT_EFFECTIVE_LABEL = '5 February 2026'

export type PartnerAgreementSection = { title: string; paragraphs: string[] }

export const PARTNER_AGREEMENT_SECTIONS: PartnerAgreementSection[] = [
  {
    title: '1. Who this agreement is with',
    paragraphs: [
      'This Partner Agreement is between you (the gym, camp, or training business operator named in your listing) and CombatStay Pty Ltd (ABN on file at combatstay.com) (“CombatStay”, “we”, “us”). By signing below you confirm you have authority to bind that business.',
      'The public Terms of Service at combatstay.com/terms also apply. If there is a conflict on marketplace topics, these partner terms control between you and CombatStay for supply-side matters.',
    ],
  },
  {
    title: '2. What we provide',
    paragraphs: [
      'We provide software, discovery, booking tools, payments orchestration, and related support so guests can find and book stays and training packages with you. We may update features and policies from time to time; material changes will be communicated in-product or by email.',
    ],
  },
  {
    title: '3. Your listing, pricing, and availability',
    paragraphs: [
      'You are responsible for the accuracy of your listing (description, photos, disciplines, inclusions, cancellation windows, and prices). You set commercial terms for packages subject to our formatting and policy tools.',
      'You will honour confirmed bookings made through the platform according to the cancellation and refund rules shown to the guest at checkout.',
    ],
  },
  {
    title: '4. Payments, fees, and payouts',
    paragraphs: [
      'CombatStay may collect payments from guests on your behalf using our payment partners (including Stripe where applicable). Platform fees and payout timing are as shown in your Partner Hub and may change with notice for future bookings.',
      'You are responsible for taxes, registrations, and licences required to operate your business in your jurisdiction.',
    ],
  },
  {
    title: '5. Conduct, safety, and compliance',
    paragraphs: [
      'You will operate safely and lawfully, maintain appropriate insurance where required, and cooperate with reasonable verification requests. Repeated serious breaches, fraud, or risk to guests may result in suspension or removal from the marketplace.',
    ],
  },
  {
    title: '6. Content and brand',
    paragraphs: [
      'You grant CombatStay a non-exclusive licence to use your listing content (name, images, copy) to market and operate the service. You confirm you have rights to the materials you upload.',
    ],
  },
  {
    title: '7. Liability',
    paragraphs: [
      'To the maximum extent permitted by law, CombatStay’s aggregate liability arising from this agreement is limited to fees we retained from your bookings in the twelve months before the claim, except where liability cannot be excluded (including under the Australian Consumer Law).',
    ],
  },
  {
    title: '8. Records',
    paragraphs: [
      'Your electronic acceptance (typed legal name, timestamp, and IP we capture at submission) forms part of our records. An executed PDF is emailed to you and retained by CombatStay for compliance and dispute resolution.',
    ],
  },
]

export function partnerAgreementPlainTextForPdf(): string {
  const header = `CombatStay Partner Agreement\nVersion ${CURRENT_PARTNER_AGREEMENT_VERSION}\nEffective ${PARTNER_AGREEMENT_EFFECTIVE_LABEL}\n\n`
  const body = PARTNER_AGREEMENT_SECTIONS.map((s) => {
    const text = s.paragraphs.join('\n\n')
    return `${s.title}\n${text}`
  }).join('\n\n')
  return `${header}${body}\n`
}
