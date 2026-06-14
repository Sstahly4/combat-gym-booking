'use client'

/** PayPal wordmark — official brand asset in /public/icons/payment */
export function PayPalMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icons/payment/paypal-wordmark.svg"
      alt="PayPal"
      className={className ?? 'h-6 w-[4.75rem] object-contain object-left'}
      loading="lazy"
      decoding="async"
    />
  )
}
