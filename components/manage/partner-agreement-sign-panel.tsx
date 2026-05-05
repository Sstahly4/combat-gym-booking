'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/hooks/use-auth'
import { clearReadinessSessionCache } from '@/lib/onboarding/readiness-session-cache'
import type { AgreementBlock } from '@/lib/legal/partner-agreement-document'
import {
  AGREEMENT_META,
  AGREEMENT_SECTIONS,
  CURRENT_PARTNER_AGREEMENT_VERSION,
  PARTNER_AGREEMENT_EFFECTIVE_LABEL,
} from '@/lib/legal/partner-agreement-document'

function AgreementBlocks({ blocks }: { blocks: AgreementBlock[] }) {
  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        const key = `${block.type}-${i}`
        if (block.type === 'paragraph') {
          return (
            <p key={key} className="whitespace-pre-line text-[13px] leading-relaxed text-gray-700">
              {block.text}
            </p>
          )
        }
        if (block.type === 'note') {
          return (
            <p
              key={key}
              className="whitespace-pre-line border-l-2 border-amber-300/90 bg-amber-50/60 py-2 pl-3 pr-2 text-[12.5px] italic leading-relaxed text-amber-950/90"
            >
              {block.text}
            </p>
          )
        }
        if (block.type === 'bullets') {
          return (
            <ul key={key} className="list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-gray-700">
              {block.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          )
        }
        return (
          <div
            key={key}
            className="my-1 overflow-x-auto rounded-lg border border-gray-200/90 bg-gray-50/40 text-[12px]"
          >
            <table className="w-full min-w-[280px] text-left">
              <tbody>
                {block.rows.map(([k, v], r) => (
                  <tr key={r} className="border-t border-gray-200/80 first:border-t-0">
                    <td className="w-[34%] align-top px-2.5 py-2 font-medium text-gray-900">{k}</td>
                    <td className="align-top px-2.5 py-2 text-gray-700">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}

const fieldClass =
  'flex h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-[15px] text-gray-900 shadow-sm transition placeholder:text-gray-400 focus-visible:border-[#003580] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/20'
const labelClass = 'text-gray-900'
const btnPrimary = 'bg-[#003580] text-white hover:bg-[#002a66] border-0 shadow-sm'
const wizLead = 'text-sm font-medium text-gray-900'
const wizBody = 'text-[14px] leading-relaxed text-gray-600'
const wizCaption = 'text-[12px] leading-relaxed text-gray-500'

export function PartnerAgreementSignPanel({
  gymId,
  embedInAdmin = false,
}: {
  gymId: string | null | undefined
  embedInAdmin?: boolean
}) {
  const { profile, refreshProfile } = useAuth()
  const [legalName, setLegalName] = useState('')
  const [accept, setAccept] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    const n = profile?.full_name?.trim()
    if (!n) return
    setLegalName((prev) => (prev.trim() ? prev : n))
  }, [profile?.full_name])

  const signed = useMemo(
    () =>
      Boolean(
        profile?.partner_agreement_signed_at &&
          profile?.partner_agreement_version === CURRENT_PARTNER_AGREEMENT_VERSION,
      ),
    [profile?.partner_agreement_signed_at, profile?.partner_agreement_version],
  )

  const submit = async () => {
    setLocalError(null)
    setSuccess(null)
    if (embedInAdmin) return
    if (profile?.placeholder_account) {
      setLocalError('Finish claiming your account first, then sign the partner agreement.')
      return
    }
    const trimmed = legalName.trim()
    if (trimmed.length < 2) {
      setLocalError('Enter your full legal name exactly as it appears in Basic Info.')
      return
    }
    if (!accept) {
      setLocalError('Check the box to confirm you accept the Partner Agreement.')
      return
    }
    const gid = gymId?.trim()
    if (!gid) {
      setLocalError('Select or create a listing first, then sign the agreement.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/manage/partner-agreement/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legal_name: trimmed,
          i_agree: true,
          gym_id: gid,
        }),
      })
      const data = (await res.json()) as {
        error?: string
        success?: boolean
        already_signed?: boolean
        email_sent?: boolean
      }
      if (!res.ok) {
        setLocalError(data.error || 'Could not save your acceptance')
        return
      }
      clearReadinessSessionCache()
      await refreshProfile()
      if (data.already_signed) {
        setSuccess('Partner agreement is already on file for your account.')
      } else if (data.email_sent === false) {
        setSuccess(
          'Your acceptance is saved. We could not email the PDF just now — contact support and we will resend it.',
        )
      } else {
        setSuccess('You are all set — we emailed a PDF copy to your inbox.')
      }
    } catch {
      setLocalError('Something went wrong. Try again in a moment.')
    } finally {
      setSubmitting(false)
    }
  }

  if (embedInAdmin) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50/90 px-5 py-4 text-[14px] leading-relaxed text-gray-700">
        <p className="font-semibold text-gray-900">Policies &amp; agreement</p>
        <p className="mt-2">
          After handoff, the owner accepts the CombatStay partner agreement and sets cancellation preferences in
          Partner Hub. Nothing to sign while you are creating this draft as staff.
        </p>
      </div>
    )
  }

  return (
    <section
      id="partner-agreement"
      className="scroll-mt-8 space-y-6 rounded-xl border border-gray-200/90 bg-white p-6 shadow-sm shadow-gray-900/[0.03] sm:p-8"
      aria-labelledby="partner-agreement-heading"
    >
      <div className="space-y-1">
        <h2 id="partner-agreement-heading" className={`${wizLead} text-base sm:text-[17px]`}>
          Partner Agreement
        </h2>
        <p className={wizBody}>
          Required before you can go live. Read the terms, type your legal name as it appears in Basic Info, and
          confirm — we email you a PDF for your records.
        </p>
      </div>

      {profile?.placeholder_account ? (
        <div className="rounded-xl border border-amber-200/90 bg-amber-50/80 px-4 py-3 text-[13px] leading-relaxed text-amber-950">
          Finish setting your password and email from the claim prompt first. After that, you can sign the partner
          agreement here.
        </div>
      ) : null}

      {signed ? (
        <div className="flex gap-3 rounded-xl border border-emerald-200/90 bg-emerald-50/80 px-4 py-4 sm:items-start">
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700"
            strokeWidth={2.25}
            aria-hidden
          />
          <div className="min-w-0 space-y-1">
            <p className="text-[14px] font-semibold text-emerald-950">Partner agreement on file</p>
            <p className="text-[13px] leading-relaxed text-emerald-900/90">
              Version {CURRENT_PARTNER_AGREEMENT_VERSION} · effective {PARTNER_AGREEMENT_EFFECTIVE_LABEL}. Full terms
              also live on{' '}
              <Link
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#003580] underline underline-offset-2"
              >
                combatstay.com/terms
              </Link>
              .
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5 rounded-2xl border border-gray-200/90 bg-[#fafbfc]/80 p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#003580]">Please review</p>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-600">
              {CURRENT_PARTNER_AGREEMENT_VERSION}
            </span>
          </div>
          <div
            className="max-h-[min(520px,62vh)] overflow-y-auto rounded-xl border border-gray-100 bg-white px-5 py-5 text-[13px] leading-[1.65] text-gray-700 scroll-smooth"
            tabIndex={0}
            role="region"
            aria-label="Partner agreement text"
          >
            <div className="space-y-1 border-b border-gray-100 pb-4">
              <p className="text-center text-[13px] font-bold uppercase tracking-wide text-gray-900">
                {AGREEMENT_META.title}
              </p>
              <p className="text-center text-[12px] text-gray-600">{PARTNER_AGREEMENT_EFFECTIVE_LABEL}</p>
              <p className="text-center text-[11px] text-gray-500">
                {AGREEMENT_META.issuingParty} · ABN {AGREEMENT_META.abn} · {AGREEMENT_META.website}
              </p>
            </div>
            <div className="mt-5 space-y-8">
              {AGREEMENT_SECTIONS.map((section) => (
                <div key={section.key} className="space-y-3">
                  {section.heading ? (
                    <p className="text-[13px] font-semibold text-gray-900">{section.heading}</p>
                  ) : null}
                  {section.body ? <AgreementBlocks blocks={section.body} /> : null}
                  {section.subsections?.map((sub) => (
                    <div key={sub.key} className="space-y-2 pl-0 sm:pl-1">
                      <p className="text-[12.5px] font-semibold text-gray-800">{sub.heading}</p>
                      <AgreementBlocks blocks={sub.body} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className={labelClass} htmlFor="partner-agreement-legal-name">
              Legal name
            </Label>
            <Input
              id="partner-agreement-legal-name"
              className={fieldClass}
              autoComplete="name"
              value={legalName}
              onChange={(e) => {
                setLegalName(e.target.value)
                setSuccess(null)
                setLocalError(null)
              }}
              placeholder={profile?.full_name?.trim() || 'As shown in Basic Info'}
            />
            <p className={wizCaption}>Must match the account holder name you saved in Basic Info (we compare automatically).</p>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-100 bg-white px-3 py-3 sm:px-4">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-[#003580] focus:ring-[#003580]"
              checked={accept}
              onChange={(e) => {
                setAccept(e.target.checked)
                setSuccess(null)
                setLocalError(null)
              }}
            />
            <span className="text-[13px] leading-relaxed text-gray-800">
              I have read and agree to the CombatStay Partner Agreement and the platform Terms of Service. I confirm I
              am authorised to bind this business.
            </span>
          </label>

          {localError ? <p className="text-[13px] font-medium text-red-700">{localError}</p> : null}
          {success ? <p className="text-[13px] font-medium text-emerald-800">{success}</p> : null}

          <Button
            className={`${btnPrimary} w-full sm:w-auto`}
            disabled={submitting || !accept || legalName.trim().length < 2}
            onClick={() => void submit()}
          >
            {submitting ? 'Saving…' : 'Confirm and sign'}
          </Button>
        </div>
      )}
    </section>
  )
}
