import Link from 'next/link'

const FAQ_MONEY_HREF = '/faq#faq-what-happens-to-my-money'

const linkClass =
  'text-gray-500 underline decoration-gray-400/60 underline-offset-2 hover:text-[#003580] hover:decoration-[#003580]/40'

type PaymentHoldExplainerProps = {
  className?: string
}

/** Unobtrusive checkout trust line — links to full money journey FAQ. */
export function PaymentHoldExplainer({
  className = 'text-xs text-center text-gray-500 mt-2',
}: PaymentHoldExplainerProps) {
  return (
    <p className={className}>
      Your card is held, not charged —{' '}
      <Link href={FAQ_MONEY_HREF} className={linkClass}>
        how it works
      </Link>
    </p>
  )
}
