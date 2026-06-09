'use client'

import type { ReactNode, SVGProps } from 'react'
import { CreditCard } from 'lucide-react'
import type { PaymentMethodChoice } from '@/components/booking/payment-method-picker'

/** Official wallet marks from brand asset downloads in /public/icons/payment */
export const PAYMENT_BRAND_ASSETS = {
  applePay: '/icons/payment/apple-pay.svg',
  googlePay: '/icons/payment/google-pay-mark_800.svg',
} as const

/**
 * Picker + summary wallet marks share one left-aligned slot system so Apple Pay and
 * Google Pay sit on the same vertical edge at matched visual height.
 */
const WALLET_MARK_SLOTS = {
  list: {
    apple: 'h-7 w-[2.875rem]',
    google: 'h-7 w-[4.75rem]',
  },
  compact: {
    apple: 'h-5 w-[2.25rem]',
    google: 'h-5 w-[3.5rem]',
  },
} as const

type WalletMarkSize = keyof typeof WALLET_MARK_SLOTS

function WalletMarkSlot({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-start overflow-hidden ${className}`}
    >
      {children}
    </span>
  )
}

type LogoProps = SVGProps<SVGSVGElement> & { className?: string }

type BrandImageProps = {
  src: string
  alt: string
  className: string
}

function PaymentBrandImage({ src, alt, className }: BrandImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- official brand SVG assets from /public
    <img src={src} alt={alt} className={className} loading="lazy" decoding="async" />
  )
}

/** Visa brand blue #1A1F71 — Visa Brand Standards */
export function VisaLogo({ className, ...props }: LogoProps) {
  return (
    <svg
      viewBox="0 0 48 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Visa"
      role="img"
      {...props}
    >
      <path
        fill="#1A1F71"
        d="M19.5 15.5h-3.2L17.6 5.2h3.2l-1.3 10.3zm11.8 0h-3l-1.9-10.3h2.8l.4 2.5.6 3.8c.1-.9.3-1.8.5-2.5l1.3-3.8h2.6l-3.3 10.3zm9.2-7.1c0-2.4-3.3-2.5-3.3-3.6 0-.3.3-.7.9-.8.3-.1 1.1-.1 2 .4l.4-2.4c-.5-.2-1.2-.4-2.1-.4-2.2 0-3.8 1.2-3.8 2.9 0 1.3 1.1 2 2 2.4.9.5 1.2.8 1.2 1.2 0 .7-.7 1-1.4 1-1.2 0-1.8-.3-2.4-.6l-.4 2.5c.6.3 1.6.5 2.7.5 2.4 0 4-1.2 4-3.1zm8.5 7.1h2.6l-2.5-10.3h-2.4c-0.7 0-1.3.4-1.6 1l-4.5 9.3h3.2l.6-1.7h3.9l.4 1.7zm-3.4-4.1 1.6-4.4.9 4.4h-2.5zM15.1 5.2 12.5 12l-.3-1.6c-.6-2-2.5-3.3-4.6-3.3H2.5l-.1.4c1.9.4 3.3 1.5 3.9 3.1L7.8 15.5h3.2l4.1-10.3z"
      />
    </svg>
  )
}

/** Mastercard red #EB001B / orange #F79E1B — Mastercard Brand Center */
export function MastercardLogo({ className, ...props }: LogoProps) {
  return (
    <svg
      viewBox="0 0 32 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Mastercard"
      role="img"
      {...props}
    >
      <circle cx="11" cy="10" r="7" fill="#EB001B" />
      <circle cx="21" cy="10" r="7" fill="#F79E1B" />
      <path
        fill="#FF5F00"
        d="M16 4.8a7 7 0 0 0-2.6 5.2A7 7 0 0 0 16 15.2a7 7 0 0 0 2.6-5.2A7 7 0 0 0 16 4.8z"
      />
    </svg>
  )
}

/** American Express blue #006FCF — Amex brand guidelines */
export function AmexLogo({ className, ...props }: LogoProps) {
  return (
    <svg
      viewBox="0 0 48 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="American Express"
      role="img"
      {...props}
    >
      <rect width="48" height="16" rx="2" fill="#006FCF" />
      <path
        fill="#fff"
        d="M6.2 5.2h1.5l.9 2.2.9-2.2h1.5v5.6H10l-.1-3.3-.9 2.2H8.1l-.9-2.2-.1 3.3H6.2V5.2zm7.2 0h2.6c1.2 0 2 .7 2 1.8 0 .8-.4 1.4-1.1 1.6l1.3 2.2h-1.7l-1.1-2h-.8v2h-1.2V5.2zm1.2 2.6h1.1c.5 0 .8-.2.8-.7 0-.5-.3-.7-.8-.7h-1.1v1.4zm5.1-2.6h3.5v1h-2.3v.9h2.1v1h-2.1v.9h2.3v1h-3.5V5.2zm6.1 0h2.1l1.4 3.5V5.2h1.2v5.6h-2l-1.4-3.5v3.5h-1.2V5.2zm6.5 0h2.6c1.2 0 2 .7 2 1.8 0 .8-.4 1.4-1.1 1.6l1.3 2.2h-1.7l-1.1-2h-.8v2h-1.2V5.2zm1.2 2.6h1.1c.5 0 .8-.2.8-.7 0-.5-.3-.7-.8-.7h-1.1v1.4zm5.5-2.6h1.5l1.5 3.8 1.5-3.8h1.5l-2.2 5.6h-1.5l-2.3-5.6z"
      />
    </svg>
  )
}

/** Google Pay acceptance mark — Google Pay API brand assets */
export function GooglePayMark({
  size = 'list',
  className,
}: {
  size?: WalletMarkSize
  className?: string
}) {
  const slot = WALLET_MARK_SLOTS[size]
  const markClass = ['block h-full w-full object-contain object-left', className]
    .filter(Boolean)
    .join(' ')
  return (
    <WalletMarkSlot className={slot.google}>
      <PaymentBrandImage src={PAYMENT_BRAND_ASSETS.googlePay} alt="Google Pay" className={markClass} />
    </WalletMarkSlot>
  )
}

/** Apple Pay acceptance mark — Apple Pay Marketing Guidelines */
export function ApplePayMark({
  size = 'list',
  className,
}: {
  size?: WalletMarkSize
  className?: string
}) {
  const slot = WALLET_MARK_SLOTS[size]
  const markClass = ['block h-full w-full object-contain object-left', className]
    .filter(Boolean)
    .join(' ')
  return (
    <WalletMarkSlot className={slot.apple}>
      <PaymentBrandImage src={PAYMENT_BRAND_ASSETS.applePay} alt="Apple Pay" className={markClass} />
    </WalletMarkSlot>
  )
}

const CARD_BRAND_LOGO_SIZES = {
  compact: {
    visa: 'h-3 w-[2.25rem]',
    mastercard: 'h-3.5 w-[1.375rem]',
    amex: 'h-3 w-[2.25rem]',
    gap: 'gap-2',
  },
  list: {
    visa: 'h-4 w-12',
    mastercard: 'h-4 w-8',
    amex: 'h-4 w-12',
    gap: 'gap-1',
  },
} as const

function CardBrandLogoSlot({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden isolate ${className}`}
    >
      {children}
    </span>
  )
}

export function CardBrandLogosRow({
  className,
  size = 'compact',
}: {
  className?: string
  size?: keyof typeof CARD_BRAND_LOGO_SIZES
}) {
  const s = CARD_BRAND_LOGO_SIZES[size]
  return (
    <div
      className={`inline-flex items-center ${s.gap} ${className ?? ''}`}
      aria-hidden
    >
      <CardBrandLogoSlot className={s.visa}>
        <VisaLogo className="block h-full w-full" preserveAspectRatio="xMidYMid meet" />
      </CardBrandLogoSlot>
      <CardBrandLogoSlot className={s.mastercard}>
        <MastercardLogo className="block h-full w-full" preserveAspectRatio="xMidYMid meet" />
      </CardBrandLogoSlot>
      <CardBrandLogoSlot className={s.amex}>
        <AmexLogo className="block h-full w-full" preserveAspectRatio="xMidYMid meet" />
      </CardBrandLogoSlot>
    </div>
  )
}

/**
 * Collapsed payment-method row on Confirm and pay — compact icon/mark beside the label.
 * Picker list uses larger `list` marks; summary uses `compact` (~20px) so marks stay inline with text.
 */
export function PaymentMethodSummaryIcon({
  method,
}: {
  method: PaymentMethodChoice
}) {
  if (method === 'card') {
    return <CreditCard className="h-5 w-5 shrink-0 text-gray-900" strokeWidth={1.75} />
  }
  if (method === 'apple_pay') {
    return <ApplePayMark size="compact" />
  }
  if (method === 'google_pay') {
    return <GooglePayMark size="compact" />
  }
  return null
}
