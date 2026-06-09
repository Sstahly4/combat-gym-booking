'use client'

/** Klarna wordmark — approximates Klarna Sans; replace with official asset if provided */
export function KlarnaWordmark({ className }: { className?: string }) {
  return (
    <span
      className={`inline-block font-bold text-gray-900 tracking-[-0.03em] ${className ?? 'text-2xl'}`}
      aria-label="Klarna"
    >
      Klarna
    </span>
  )
}
