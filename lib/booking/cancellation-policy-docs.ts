/** Checkout full-policy copy — aligned with Terms §5–7 and FAQ payment/cancellation answers. */

export type CancellationPolicyDocSection = {
  title: string
  paragraphs: string[]
  bullets?: string[]
}

export const CHECKOUT_CANCELLATION_POLICY_DOC: CancellationPolicyDocSection[] = [
  {
    title: 'Cancellation and refunds',
    paragraphs: [
      'You are bound by the gym\'s cancellation policy as shown and agreed to at checkout for that booking, including the cancellation deadline and refund position recorded at payment.',
      'Cancellation policies vary by gym and package type. The applicable terms for your purchase are those presented on the package and confirmed at checkout.',
      'Free cancellation windows, where offered, are clearly displayed. Card charges may be captured only after that window has closed, as described in checkout and payment processing notices.',
      'Refunds are processed according to that policy and our terms of service. Refunds may take 5–10 business days to appear in your account. We are not responsible for currency conversion fees or bank charges.',
    ],
  },
  {
    title: 'What happens to your payment',
    paragraphs: ['When you book, we usually place a temporary hold on your card — you are not charged yet.'],
    bullets: [
      'You book — a hold is placed on your card. No charge yet.',
      'Gym confirms — the hold stays in place until your free cancellation window closes (if your package includes one).',
      'Cancellation window ends — payment is captured. CombatStay appears on your statement, not the gym.',
      'You stay — the gym is paid within 3 business days after check-in (your first 3 bookings may use a longer provisional schedule after checkout).',
    ],
  },
  {
    title: 'If you cancel',
    paragraphs: [
      'Inside the free cancellation window — cancel before the date and time shown for your package: we release the card hold and you are not charged.',
      'After the window — your payment may be captured and the package rules you agreed to at checkout apply.',
      'If something goes wrong — cancel in time and the hold is released with no charge. If the gym declines your booking, the hold is released with no charge. If a refund is needed, we initiate it within one business day; banks usually show it in 5–10 business days.',
      'Your card details are never shared with the gym.',
    ],
  },
  {
    title: 'Payment terms',
    paragraphs: [
      'For card payments made through the platform, CombatStay acts as the merchant of record. Your payment is processed with us; the gym provides the training or related services as an independent supplier.',
      'What you agree to at checkout, including cancellation terms, is recorded with the transaction.',
      'All prices are displayed in the currency you select at checkout. Prices include applicable taxes unless otherwise stated.',
    ],
  },
]
