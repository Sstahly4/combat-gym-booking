'use client'

/** Official Klarna wordmark — Wikimedia Commons / Klarna AB */
export const KLARNA_WORDMARK_ASSET = '/icons/payment/klarna-wordmark.svg'

export function KlarnaWordmark({ className }: { className?: string }) {
  return (
    <img
      src={KLARNA_WORDMARK_ASSET}
      alt="Klarna"
      className={`inline-block w-auto shrink-0 object-contain object-left ${className ?? 'h-7'}`}
    />
  )
}
