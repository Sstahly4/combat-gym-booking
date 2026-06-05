'use client'

/**
 * P2 — Coach panel shown alongside ConnectAccountOnboarding.
 *
 * Guides the partner through the Google Authenticator QR-scan step while
 * the Stripe drawer is open. Renders on the right side on desktop, below
 * the Stripe component on mobile.
 *
 * Video slot (step 2): add public/partner/stripe-authenticator-guide.mp4
 * to activate — the video element hides itself gracefully if the file is
 * missing. See docs/stripe-payout-onboarding-ux.md → Video brief.
 */

import { Smartphone, ScanLine, Camera } from 'lucide-react'

type Props = {
  preferredLanguage?: string | null
}

const COPY = {
  en: {
    heading: 'How to scan the QR code',
    steps: [
      {
        title: 'Open Google Authenticator',
        body: "Open the app on your phone. Don't have it yet? Download it from the links above.",
      },
      {
        title: 'Tap + then "Scan a QR code"',
        body: 'Tap the blue + button in the bottom-right corner, then tap "Scan a QR code".',
      },
      {
        title: 'Point your camera at the QR code',
        body: 'When the camera opens, point it at the QR code on screen. It scans automatically.',
      },
    ],
    supportLabel: 'Need help?',
    lineLabel: 'LINE support',
    waLabel: 'WhatsApp',
  },
  th: {
    heading: 'วิธีสแกน QR code',
    steps: [
      {
        title: 'เปิด Google Authenticator',
        body: 'เปิดแอปบนมือถือ ยังไม่มี? ดาวน์โหลดจากลิงก์ด้านบน',
      },
      {
        title: 'แตะ + แล้วเลือก "สแกน QR code"',
        body: 'แตะปุ่ม + สีน้ำเงิน (มุมล่างขวา) แล้วแตะ "สแกน QR code"',
      },
      {
        title: 'ชี้กล้องไปที่ QR code บนหน้าจอ',
        body: 'เมื่อกล้องเปิดขึ้น ชี้ไปที่ QR code ที่แสดงบนหน้าจอ ระบบจะสแกนอัตโนมัติ',
      },
    ],
    supportLabel: 'ต้องการความช่วยเหลือ?',
    lineLabel: 'ติดต่อ LINE',
    waLabel: 'WhatsApp',
  },
} as const

const STEP_ICONS = [Smartphone, ScanLine, Camera]

export function StripeAuthenticatorCoachPanel({ preferredLanguage }: Props) {
  const isThai = preferredLanguage === 'th-TH'
  const copy = isThai ? COPY.th : COPY.en

  const lineUrl = process.env.NEXT_PUBLIC_PARTNER_LINE_URL
  const waUrl = process.env.NEXT_PUBLIC_PARTNER_WHATSAPP_URL
  const hasSupport = Boolean(lineUrl || waUrl)

  return (
    <aside
      aria-label={copy.heading}
      className="rounded-xl border border-gray-200/80 bg-gray-50/60 px-4 py-5"
    >
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {copy.heading}
      </p>

      <ol className="space-y-5" role="list">
        {copy.steps.map((step, i) => {
          const Icon = STEP_ICONS[i]
          const isVideoStep = i === 1

          return (
            <li key={i} className="flex gap-3">
              <div className="flex flex-col items-center gap-1">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#003580]/10 text-[11px] font-bold text-[#003580]">
                  {i + 1}
                </span>
                {i < copy.steps.length - 1 && (
                  <div className="w-px flex-1 bg-gray-200/80" aria-hidden />
                )}
              </div>

              <div className="min-w-0 pb-1">
                <div className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-gray-500" strokeWidth={2} aria-hidden />
                  <p className="text-[13px] font-semibold text-gray-900">{step.title}</p>
                </div>
                <p className="mt-0.5 text-[12px] leading-relaxed text-gray-600">{step.body}</p>

                {isVideoStep && (
                  <div className="mt-2.5">
                    {/*
                      Add public/partner/stripe-authenticator-guide.mp4 to activate.
                      The video hides itself via onError if the file is missing.
                      Brief: 30 s, Thai phone UI, muted, <5 MB, 1080p or lower.
                      See docs/stripe-payout-onboarding-ux.md → Video brief.
                    */}
                    <video
                      src="/partner/stripe-authenticator-guide.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full rounded-md border border-gray-200/80"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLVideoElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      {hasSupport && (
        <div className="mt-5 border-t border-gray-200/60 pt-4">
          <p className="mb-1.5 text-[11px] font-medium text-gray-500">{copy.supportLabel}</p>
          <div className="flex flex-wrap gap-2">
            {lineUrl && (
              <a
                href={lineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-7 items-center rounded-md border border-gray-200 bg-white px-3 text-[11px] font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
              >
                {copy.lineLabel}
              </a>
            )}
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-7 items-center rounded-md border border-gray-200 bg-white px-3 text-[11px] font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
              >
                {copy.waLabel}
              </a>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}
