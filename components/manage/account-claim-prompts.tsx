'use client'

/**
 * Account-claim hard + soft prompts.
 *
 * Hard prompt: a non-dismissible blocking modal that opens on every /manage
 * page until a placeholder owner sets their own password. We deliberately do
 * NOT close on outside-click and we do NOT render an X button — they have to
 * choose a password to continue using the dashboard. This protects the gym
 * from someone keeping a long-lived session on the original synthetic password.
 *
 * Soft prompt: once the password is set but the email is still the placeholder
 * domain from lib/admin/gym-claim, we render a small banner nudging them
 * to update it. Dismissible per session (sessionStorage).
 */
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { PLACEHOLDER_EMAIL_DOMAIN } from '@/lib/admin/gym-claim-constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { validatePasswordRules } from '@/lib/auth/password-rules'
import { PasswordStandardsHint } from '@/components/auth/password-standards-hint'
const SOFT_PROMPT_DISMISS_KEY = 'cb:claim-email-soft-prompt-dismissed'

function isPlaceholderEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return email.toLowerCase().endsWith(`@${PLACEHOLDER_EMAIL_DOMAIN}`)
}

interface ClaimProfile {
  placeholder_account?: boolean | null
  claim_password_set?: boolean | null
  placeholder_email?: string | null
}

export function AccountClaimPrompts() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const justClaimed = searchParams?.get('claimed') === '1'

  const claim = profile as unknown as ClaimProfile | null
  const needsPassword = !!claim?.placeholder_account || claim?.claim_password_set === false
  const needsEmail =
    !needsPassword &&
    (isPlaceholderEmail(user?.email) || !!claim?.placeholder_email)

  if (loading || !profile) return null
  if (!needsPassword && !needsEmail) return null

  return (
    <>
      {needsPassword && (
        <HardClaimModal
          currentEmail={user?.email ?? ''}
          showWelcome={justClaimed}
          onDone={() => router.refresh()}
        />
      )}
      {needsEmail && <SoftEmailBanner currentEmail={user?.email ?? ''} />}
    </>
  )
}

function HardClaimModal({
  currentEmail,
  showWelcome,
  onDone,
}: {
  currentEmail: string
  showWelcome: boolean
  onDone: () => void
}) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [email, setEmail] = useState(
    isPlaceholderEmail(currentEmail) ? '' : currentEmail,
  )
  const [fullName, setFullName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [details, setDetails] = useState<string[] | null>(null)

  // Lock body scroll while open so they can't side-step the modal.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const passwordsMatch = useMemo(
    () => password.length > 0 && password === confirm,
    [password, confirm],
  )
  const passwordValidation = useMemo(() => validatePasswordRules(password), [password])

  async function submit() {
    setError(null); setDetails(null)
    if (!passwordValidation.valid) {
      setError('Password does not meet security requirements')
      setDetails(passwordValidation.errors)
      return
    }
    if (!passwordsMatch) {
      setError('Passwords do not match'); return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/manage/account/complete-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_password: password,
          new_email: email.trim() || undefined,
          full_name: fullName.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Could not save your password')
        if (Array.isArray(data?.details)) setDetails(data.details)
        return
      }
      onDone()
    } catch (err: any) {
      setError(err?.message || 'Could not save your password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-modal-title"
      className="fixed inset-0 z-[100] flex items-end justify-center bg-stone-900/70 px-3 pb-3 pt-10 sm:items-center sm:p-6"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-stone-100 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">
            {showWelcome ? 'Welcome to your gym' : 'Action required'}
          </p>
          <h2 id="claim-modal-title" className="mt-1 text-xl font-semibold text-stone-900">
            Set your password to continue
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            Combat Booking pre-listed your gym for you. Pick a password (and your
            real email if you'd like) to take ownership of this account. You'll
            be able to connect Stripe, edit your gym, and start taking bookings
            right after.
          </p>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <Label htmlFor="claim-pw">New password</Label>
            <PasswordInput
              id="claim-pw"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a strong password"
            />
            <PasswordStandardsHint className="mt-2" showErrors={false} />
          </div>
          <div>
            <Label htmlFor="claim-pw2">Confirm password</Label>
            <PasswordInput
              id="claim-pw2"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            {confirm && !passwordsMatch && (
              <p className="mt-1 text-xs text-rose-600">Passwords do not match</p>
            )}
          </div>

          <div className="border-t border-stone-100 pt-4">
            <Label htmlFor="claim-email">Your email (optional but recommended)</Label>
            <Input
              id="claim-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourgym.com"
            />
            <p className="mt-1 text-xs text-stone-500">
              We use this for booking notifications, payouts, and account
              recovery. You can update this later in Settings.
            </p>
          </div>

          <div>
            <Label htmlFor="claim-name">Your name (optional)</Label>
            <Input
              id="claim-name"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Coach name or contact person"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              <p>{error}</p>
              {details && details.length > 0 && (
                <ul className="ml-4 mt-1 list-disc text-xs">
                  {details.map((d) => (<li key={d}>{d}</li>))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-stone-100 bg-stone-50 px-6 py-4">
          <Button
            onClick={submit}
            disabled={submitting || !passwordsMatch || !passwordValidation.valid}
            className="bg-[#003580] text-white hover:bg-[#002a5c]"
          >
            {submitting ? 'Saving…' : 'Save and continue'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function SoftEmailBanner({ currentEmail }: { currentEmail: string }) {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const v = window.sessionStorage.getItem(SOFT_PROMPT_DISMISS_KEY)
    setDismissed(v === '1')
  }, [])

  if (dismissed) return null

  return (
    <div className="border-b border-[#003580]/15 bg-[#003580]/[0.06] px-4 py-2 text-sm text-[#0a2540]">
      <div className="mx-auto flex max-w-6xl items-center gap-3">
        <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-[#003580]" />
        <p className="flex-1">
          Your account is still using a temporary email
          {currentEmail ? <> (<code className="rounded bg-white/60 px-1">{currentEmail}</code>)</> : null}.
          Update it in
          {' '}
          <a href="/manage/settings?tab=account" className="font-medium text-[#003580] underline underline-offset-2 hover:text-[#002a5c]">
            Settings → Account
          </a>
          {' '}so we can send booking and payout notifications to the right inbox.
        </p>
        <button
          type="button"
          onClick={() => {
            window.sessionStorage.setItem(SOFT_PROMPT_DISMISS_KEY, '1')
            setDismissed(true)
          }}
          className="rounded-full px-2 py-0.5 text-xs font-medium text-[#003580] hover:bg-[#003580]/10"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
