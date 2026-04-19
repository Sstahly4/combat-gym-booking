'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type TotpFactor = { id: string; status: string }

export interface MfaTotpInlineSectionProps {
  subsectionClassName: string
  mutedClassName: string
  outlineButtonClassName: string
  /** When false (e.g. on /manage/settings/security), omit the link to this same page. */
  showSecuritySettingsLink?: boolean
  /** Inside another card: skip top border/padding. */
  embedded?: boolean
}

/**
 * Optional TOTP enrollment via Supabase Auth MFA (requires MFA enabled in project dashboard).
 * Reused on owner onboarding (Password & security) and /manage/settings/security.
 */
export function MfaTotpInlineSection({
  subsectionClassName,
  mutedClassName,
  outlineButtonClassName,
  showSecuritySettingsLink = true,
  embedded = false,
}: MfaTotpInlineSectionProps) {
  const [ready, setReady] = useState(false)
  const [verified, setVerified] = useState(false)
  const [setupOpen, setSetupOpen] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [pendingFactorId, setPendingFactorId] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [totpSecret, setTotpSecret] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [recoveryRemaining, setRecoveryRemaining] = useState<number | null>(null)
  const [recoveryGenerating, setRecoveryGenerating] = useState(false)
  const [revealedCodes, setRevealedCodes] = useState<string[] | null>(null)
  const [recoveryErr, setRecoveryErr] = useState<string | null>(null)

  const loadFactors = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) {
      setReady(true)
      setVerified(false)
      return
    }
    const totp = ((data as { totp?: TotpFactor[] })?.totp ?? []) as TotpFactor[]
    setVerified(totp.some((f) => f.status === 'verified'))
    setReady(true)
  }, [])

  const loadRecoveryStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/mfa/recovery-codes', { cache: 'no-store' })
      if (!res.ok) {
        setRecoveryRemaining(null)
        return
      }
      const data = (await res.json()) as { enabled?: boolean; remaining?: number }
      setRecoveryRemaining(data.enabled === false ? null : data.remaining ?? 0)
    } catch {
      setRecoveryRemaining(null)
    }
  }, [])

  useEffect(() => {
    void loadFactors()
    void loadRecoveryStatus()
  }, [loadFactors, loadRecoveryStatus])

  const generateRecoveryCodes = async () => {
    setRecoveryErr(null)
    setRecoveryGenerating(true)
    try {
      const res = await fetch('/api/auth/mfa/recovery-codes', { method: 'POST' })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error || 'Failed to generate codes')
      }
      const data = (await res.json()) as { codes: string[]; count: number }
      setRevealedCodes(data.codes)
      setRecoveryRemaining(data.count)
    } catch (e: any) {
      setRecoveryErr(e?.message || 'Could not generate recovery codes')
    } finally {
      setRecoveryGenerating(false)
    }
  }

  const clearPendingUi = () => {
    setSetupOpen(false)
    setPendingFactorId(null)
    setQrDataUrl(null)
    setTotpSecret(null)
    setCode('')
    setErr(null)
  }

  const cancelSetup = async () => {
    if (!pendingFactorId) {
      clearPendingUi()
      return
    }
    const supabase = createClient()
    await supabase.auth.mfa.unenroll({ factorId: pendingFactorId })
    clearPendingUi()
    void loadFactors()
  }

  const startEnroll = async () => {
    setErr(null)
    setMsg(null)
    setEnrolling(true)
    const supabase = createClient()

    const { data: listData } = await supabase.auth.mfa.listFactors()
    const totp = ((listData as { totp?: TotpFactor[] })?.totp ?? []) as TotpFactor[]
    for (const f of totp.filter((x) => x.status === 'unverified')) {
      await supabase.auth.mfa.unenroll({ factorId: f.id })
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Authenticator app',
    })
    setEnrolling(false)

    if (error || !data) {
      setErr(
        error?.message ||
          'Could not start authenticator setup. If this persists, enable TOTP MFA under Supabase Dashboard → Authentication → Multi-factor, or try again from Security settings.'
      )
      return
    }

    setPendingFactorId(data.id)
    setQrDataUrl(data.totp?.qr_code ?? null)
    setTotpSecret(data.totp?.secret ?? null)
    setSetupOpen(true)
  }

  const submitVerify = async () => {
    if (!pendingFactorId) return
    const trimmed = code.replace(/\s/g, '')
    if (trimmed.length < 6) return

    setBusy(true)
    setErr(null)
    const supabase = createClient()
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: pendingFactorId,
      code: trimmed,
    })
    setBusy(false)

    if (error) {
      setErr(error.message || 'That code did not work. Check the time on your device and try a new code.')
      return
    }

    setMsg('Authenticator is enabled. You may be asked for a code when you sign in or take sensitive actions.')
    clearPendingUi()
    setVerified(true)
  }

  const shell = embedded ? 'space-y-3' : 'space-y-3 border-t border-gray-100 pt-8'

  if (!ready) {
    return (
      <div className={shell}>
        <div className="h-6 w-48 animate-pulse rounded bg-gray-100" />
        <div className="h-20 animate-pulse rounded-lg bg-gray-100" />
      </div>
    )
  }

  return (
    <div className={shell}>
      <p className={subsectionClassName}>Two-factor authentication (optional)</p>
      <p className={mutedClassName}>
        Add an authenticator app for an extra sign-in step and stronger protection for payout-related actions.{' '}
        <strong className="font-medium text-gray-800">Totally optional.</strong>{' '}
        {showSecuritySettingsLink ? (
          <>
            Set it up below now, <span className="whitespace-nowrap">or</span> enable TOTP from{' '}
            <Link
              href="/manage/settings/security"
              className="font-medium text-[#003580] underline-offset-2 hover:underline"
            >
              Security settings
            </Link>{' '}
            anytime.
          </>
        ) : (
          <>You can turn it on or off here whenever you like.</>
        )}
      </p>

      {msg ? (
        <p className="text-sm font-medium text-green-800" role="status">
          {msg}
        </p>
      ) : null}

      {verified ? (
        <p className="text-sm font-medium text-green-800">Authenticator app is enabled on your account.</p>
      ) : null}

      {verified ? (
        <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 text-left">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className={subsectionClassName}>Recovery codes</p>
              <p className={mutedClassName}>
                One-time backup codes. Use one if you lose access to your authenticator.{' '}
                {recoveryRemaining !== null ? (
                  <strong className="font-medium text-gray-800">
                    {recoveryRemaining} {recoveryRemaining === 1 ? 'code' : 'codes'} remaining.
                  </strong>
                ) : null}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className={outlineButtonClassName}
              disabled={recoveryGenerating}
              onClick={() => void generateRecoveryCodes()}
            >
              {recoveryGenerating
                ? 'Generating…'
                : recoveryRemaining && recoveryRemaining > 0
                  ? 'Regenerate codes'
                  : 'Generate codes'}
            </Button>
          </div>

          {revealedCodes ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
              <p className="mb-2 text-sm font-medium text-amber-900">
                Save these codes now. You won&apos;t see them again.
              </p>
              <ul className="grid grid-cols-2 gap-2 font-mono text-sm text-gray-900 sm:grid-cols-3">
                {revealedCodes.map((c) => (
                  <li key={c} className="rounded bg-white px-2 py-1 text-center">
                    {c}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="mt-3 text-xs font-medium text-[#003580] underline-offset-2 hover:underline"
                onClick={() => {
                  void navigator.clipboard.writeText(revealedCodes.join('\n'))
                }}
              >
                Copy all to clipboard
              </button>
            </div>
          ) : null}

          {recoveryErr ? (
            <p className="text-sm text-red-700" role="alert">
              {recoveryErr}
            </p>
          ) : null}
        </div>
      ) : (
        <p className={`${mutedClassName} text-left`}>
          <span className="font-medium text-gray-800">Recovery:</span> after enabling the authenticator, you&apos;ll be
          able to generate one-time backup codes here for use if you lose your device.
        </p>
      )}

      {verified ? null : setupOpen && pendingFactorId ? (
        <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50/80 p-4 text-left">
          <p className={`text-sm text-gray-700`}>
            Scan the QR code with Google Authenticator, Authy, 1Password, etc., or enter the secret manually.
          </p>
          {qrDataUrl ? (
            <div className="flex justify-center sm:justify-start">
              {/* eslint-disable-next-line @next/next/no-img-element -- Stripe/Supabase returns a data URL */}
              <img src={qrDataUrl} alt="Scan to add authenticator" className="h-40 w-40 rounded border bg-white p-1" />
            </div>
          ) : null}
          {totpSecret ? (
            <p className="break-all font-mono text-xs text-gray-800">
              <span className="font-sans text-sm font-medium text-gray-600">Secret: </span>
              {totpSecret}
            </p>
          ) : null}
          <div className="space-y-2">
            <label htmlFor="mfa-totp-code" className="text-sm font-medium text-gray-800">
              6-digit code
            </label>
            <Input
              id="mfa-totp-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={12}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="max-w-[12rem] font-mono tracking-widest"
            />
          </div>
          {err ? (
            <p className="text-sm text-red-700" role="alert">
              {err}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className={outlineButtonClassName}
              disabled={busy || code.replace(/\s/g, '').length < 6}
              onClick={() => void submitVerify()}
            >
              {busy ? 'Verifying…' : 'Verify and enable'}
            </Button>
            <Button type="button" variant="ghost" className="text-gray-600" onClick={() => void cancelSetup()}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          {err ? (
            <p className="text-left text-sm text-red-700" role="alert">
              {err}
            </p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className={outlineButtonClassName}
            disabled={enrolling}
            onClick={() => void startEnroll()}
          >
            {enrolling ? 'Starting…' : 'Set up authenticator app'}
          </Button>
        </>
      )}
    </div>
  )
}
