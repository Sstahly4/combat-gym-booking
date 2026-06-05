'use client'

import { RotateCcw, CheckCircle2 } from 'lucide-react'
import { getRequirementLabels } from '@/lib/manage/stripe-requirements-labels'

export type StripePayoutRecoveryCardProps = {
  /** BCP-47 locale for copy. */
  preferredLanguage?: string | null
  /** gym.stripe_requirements_currently_due — may be empty if webhook hasn't fired yet. */
  currentlyDue: string[]
  /** gym.last_stripe_account_sync_at ISO string — shown as a trust signal for support calls. */
  lastSyncAt: string | null
}

function formatSyncTime(iso: string | null): string | null {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

const COPY = {
  en: {
    heading: 'Continue where you left off',
    stepsLabel: 'Steps still needed:',
    noStepsYet:
      "Open the setup flow below — we'll pull the remaining steps once Stripe confirms your progress.",
    lastChecked: (t: string) => `Last checked: ${t}`,
    supportLine: 'Need help?',
    lineLabel: 'Contact us on LINE',
    waLabel: 'WhatsApp support',
  },
  th: {
    heading: 'ดำเนินการต่อจากที่ค้างไว้',
    stepsLabel: 'ขั้นตอนที่ยังต้องทำ:',
    noStepsYet:
      'เปิดขั้นตอนการตั้งค่าด้านล่างเพื่อดำเนินการต่อ — ขั้นตอนที่เหลือจะแสดงหลัง Stripe ยืนยันความคืบหน้าของคุณ',
    lastChecked: (t: string) => `ตรวจสอบล่าสุด: ${t}`,
    supportLine: 'ต้องการความช่วยเหลือ?',
    lineLabel: 'ติดต่อเราทาง LINE',
    waLabel: 'WhatsApp',
  },
} as const

export function StripePayoutRecoveryCard({
  preferredLanguage,
  currentlyDue,
  lastSyncAt,
}: StripePayoutRecoveryCardProps) {
  const isThai = preferredLanguage === 'th-TH'
  const copy = isThai ? COPY.th : COPY.en
  const lang = isThai ? 'th' : 'en'

  const stepLabels = getRequirementLabels(currentlyDue, lang)
  const syncTime = formatSyncTime(lastSyncAt)

  const lineUrl = process.env.NEXT_PUBLIC_PARTNER_LINE_URL
  const waUrl = process.env.NEXT_PUBLIC_PARTNER_WHATSAPP_URL
  const hasSupport = Boolean(lineUrl || waUrl)

  return (
    <div className="rounded-lg border border-gray-200/80 bg-white px-4 py-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100/80 ring-1 ring-gray-200/80">
          <RotateCcw className="h-3.5 w-3.5 text-gray-600" strokeWidth={2} aria-hidden />
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-sm font-semibold text-gray-900">{copy.heading}</p>

          {stepLabels.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-[12px] font-medium uppercase tracking-wide text-gray-500">
                {copy.stepsLabel}
              </p>
              <ul className="space-y-1" role="list">
                {stepLabels.map((label) => (
                  <li key={label} className="flex items-start gap-2">
                    <CheckCircle2
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-300"
                      strokeWidth={2}
                      aria-hidden
                    />
                    <span className="text-[13px] leading-relaxed text-gray-700">{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-[13px] leading-relaxed text-gray-600">{copy.noStepsYet}</p>
          )}

          {(syncTime || hasSupport) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
              {syncTime && (
                <span className="text-[11px] text-gray-400">{copy.lastChecked(syncTime)}</span>
              )}
              {hasSupport && (
                <span className="flex items-center gap-2 text-[11px] text-gray-500">
                  <span>{copy.supportLine}</span>
                  {lineUrl && (
                    <a
                      href={lineUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[#003580] underline-offset-2 hover:underline"
                    >
                      {copy.lineLabel}
                    </a>
                  )}
                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[#003580] underline-offset-2 hover:underline"
                    >
                      {copy.waLabel}
                    </a>
                  )}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
