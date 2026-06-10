import Link from 'next/link'

const linkClass =
  'font-medium text-gray-900 underline underline-offset-2 hover:text-gray-700 transition-colors'

export function CheckoutPaymentConsent({ className }: { className?: string }) {
  return (
    <p className={`text-left text-xs leading-relaxed text-gray-600 ${className ?? ''}`}>
      By selecting the button, I agree to the{' '}
      <Link
        href="/terms#booking-terms"
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        booking terms
      </Link>{' '}
      and updated{' '}
      <Link href="/terms" target="_blank" rel="noopener noreferrer" className={linkClass}>
        Terms of Service
      </Link>
      . View{' '}
      <Link href="/privacy" target="_blank" rel="noopener noreferrer" className={linkClass}>
        Privacy Policy
      </Link>
      .
    </p>
  )
}
