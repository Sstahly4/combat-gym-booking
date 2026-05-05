'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ReAuthDialog } from '@/components/auth/re-auth-dialog'
import { PasswordStandardsHint } from '@/components/auth/password-standards-hint'
import { RESIDENCE_COUNTRIES } from '@/lib/constants/residence-countries'
import type { AccountHolderPropertyRole } from '@/lib/types/database'
import { CheckCircle2, ShieldCheck, ArrowRight, ChevronDown } from 'lucide-react'
import { useBootstrapProfileIfMissing } from '@/lib/hooks/use-bootstrap-profile-if-missing'

const ROLE_OPTIONS: Array<{ value: AccountHolderPropertyRole; label: string }> = [
  { value: 'owner', label: 'Owner' },
  { value: 'manager', label: 'Manager' },
  { value: 'authorised_operator', label: 'Authorised operator' },
]

export default function SecurityOnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const justVerified = searchParams.get('verified') === '1'
  const { user, profile, loading: authLoading, refreshProfile } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showReAuth, setShowReAuth] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [selfServeExpired, setSelfServeExpired] = useState(false)

  const [legalFirstName, setLegalFirstName] = useState('')
  const [legalLastName, setLegalLastName] = useState('')
  const [accountHolderPhone, setAccountHolderPhone] = useState('')
  const [roleAtProperty, setRoleAtProperty] = useState<AccountHolderPropertyRole | ''>('')
  const [countryOfResidence, setCountryOfResidence] = useState('')

  const [healingRole, setHealingRole] = useState(false)

  const profileRecoverFailed = useBootstrapProfileIfMissing({
    authLoading,
    user,
    profile,
    refreshProfile,
  })

  useEffect(() => {
    if (profileRecoverFailed) {
      router.replace('/auth/signin')
    }
  }, [profileRecoverFailed, router])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/auth/signin')
      return
    }
    if (!profile) {
      return
    }
    if (profile.role !== 'owner') {
      // Self-heal: a user landing here with verified=1 or with role_intent === 'owner'
      // in their metadata is a legitimate partner whose profile.role didn't get promoted
      // (stale verification email, race condition, or signup that skipped the metadata
      // update). Call the server-side promotion endpoint instead of bouncing them to /,
      // which would leave them stuck and confused.
      const intentOwner = user.user_metadata?.role_intent === 'owner'
      if ((justVerified || intentOwner) && !healingRole) {
        setHealingRole(true)
        void fetch('/api/auth/update-profile-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: 'owner',
            full_name: user.user_metadata?.full_name || profile.full_name || null,
          }),
        })
          .then(() => {
            // Force a hard reload so useAuth re-fetches the profile with role=owner.
            window.location.replace('/manage/security-onboarding?verified=1')
          })
          .catch(() => {
            setHealingRole(false)
            router.replace('/')
          })
        return
      }
      if (healingRole) return
      router.replace('/')
    }
  }, [authLoading, user, profile, router, justVerified, healingRole])

  useEffect(() => {
    if (!profile) return
    setLegalFirstName(profile.legal_first_name || '')
    setLegalLastName(profile.legal_last_name || '')
    setAccountHolderPhone(profile.account_holder_phone || '')
    setRoleAtProperty((profile.role_at_property as AccountHolderPropertyRole) || '')
    setCountryOfResidence(profile.country_of_residence || '')
  }, [profile])

  useEffect(() => {
    if (!user) {
      setSelfServeExpired(false)
      return
    }

    const onboardingEntry = user.user_metadata?.onboarding_entry
    const expiresAtRaw = user.user_metadata?.onboarding_link_expires_at
    const expiresAtMs =
      typeof expiresAtRaw === 'string' ? new Date(expiresAtRaw).getTime() : Number.NaN
    const expired =
      onboardingEntry === 'self_serve' &&
      Number.isFinite(expiresAtMs) &&
      Date.now() > expiresAtMs

    setSelfServeExpired(expired)
    if (expired) {
      setError('Your self-serve verification link has expired (24h). Request a new link to continue.')
    }
  }, [user])

  useEffect(() => {
    if (authLoading || !profile?.id || profile.country_of_residence) return

    let cancelled = false
    const run = async () => {
      try {
        const response = await fetch('/api/geo/country-hint', { cache: 'no-store' })
        if (!response.ok) return
        const data = (await response.json()) as { country_code?: string | null }
        if (cancelled || !data.country_code) return
        const match = RESIDENCE_COUNTRIES.find((c) => c.code === data.country_code)
        if (match) {
          setCountryOfResidence((prev) => prev || match.name)
        }
      } catch {
        // optional hint
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [authLoading, profile?.id, profile?.country_of_residence])

  const accountHolderComplete = useMemo(() => {
    const phoneOk = /^[\d\s+().-]+$/.test(accountHolderPhone) && accountHolderPhone.replace(/\D/g, '').length >= 8
    return (
      legalFirstName.trim().length > 0 &&
      legalLastName.trim().length > 0 &&
      phoneOk &&
      Boolean(roleAtProperty) &&
      Boolean(countryOfResidence)
    )
  }, [legalFirstName, legalLastName, accountHolderPhone, roleAtProperty, countryOfResidence])

  const completeSecurityStep = async () => {
    if (!accountHolderComplete || !roleAtProperty) return

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/onboarding/security/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legal_first_name: legalFirstName.trim(),
          legal_last_name: legalLastName.trim(),
          account_holder_phone: accountHolderPhone.trim(),
          role_at_property: roleAtProperty,
          country_of_residence: countryOfResidence,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to save security onboarding')
        setSubmitting(false)
        return
      }

      router.replace('/manage/onboarding?step=step-1')
    } catch (submitError: any) {
      setError(submitError?.message || 'Failed to save security onboarding')
      setSubmitting(false)
    }
  }

  const handleUpdatePassword = async () => {
    setPasswordMessage(null)
    setError(null)

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match')
      return
    }

    setUpdatingPassword(true)
    try {
      const response = await fetch('/api/auth/password/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        if (Array.isArray(data.details) && data.details.length > 0) {
          setError(data.details.join('. '))
        } else {
          setError(data.error || 'Failed to update password')
        }
        setUpdatingPassword(false)
        return
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMessage('Password updated. Use your new password to confirm and continue.')
    } catch (updateError: any) {
      setError(updateError?.message || 'Failed to update password')
    } finally {
      setUpdatingPassword(false)
    }
  }

  if (authLoading || profileRecoverFailed || (user && !profile)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#003580] border-t-transparent" aria-hidden />
      </div>
    )
  }

  const emailVerified = Boolean(user?.email_confirmed_at)

  return (
    <div className="min-h-screen bg-[#f7f8fa] pb-32">
      <div className="mx-auto w-full max-w-[640px] px-4 pt-6 pb-10 sm:pt-10">

        {/* Slim verified banner — quiet, OTA-style, only on first arrival */}
        {justVerified && (
          <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-emerald-100 bg-emerald-50/80 px-3.5 py-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2} />
            <p className="text-[13px] font-medium text-emerald-900">
              Email verified — welcome to CombatStay Partner Hub.
            </p>
          </div>
        )}

        {/* Stepper — Stripe / Booking partner style */}
        <div className="mb-7 flex items-center gap-2 text-[12px] font-medium text-gray-500">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#003580] text-[10px] font-bold text-white">
            1
          </span>
          <span className="text-gray-900">Account &amp; security</span>
          <span className="text-gray-300">›</span>
          <span>Property profile</span>
          <span className="text-gray-300">›</span>
          <span>Review</span>
        </div>

        {/* Title */}
        <header className="mb-8">
          <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-gray-900 sm:text-[28px]">
            Set up your partner account
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-gray-600">
            We need the <span className="font-medium text-gray-900">account holder</span> on record — for
            legal accountability and a contact we can reach. This is separate from your gym&apos;s public
            listing. Payout details are completed later in Stripe Connect.
          </p>
        </header>

        {/* ── Account holder details ─────────────────────────────────── */}
        <section id="account-holder-details" className="mb-10">
          <h2 className="text-[15px] font-semibold text-gray-900">Account holder details</h2>
          <p className="mt-1 text-[13px] text-gray-500">
            Who is responsible if there&apos;s a dispute or we need to reach someone directly.
          </p>

          <div className="mt-5 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="legal-first" className="text-[13px] font-medium text-gray-700">
                  Legal first name
                </Label>
                <Input
                  id="legal-first"
                  autoComplete="given-name"
                  value={legalFirstName}
                  onChange={(e) => setLegalFirstName(e.target.value)}
                  placeholder="As on official ID"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="legal-last" className="text-[13px] font-medium text-gray-700">
                  Legal last name
                </Label>
                <Input
                  id="legal-last"
                  autoComplete="family-name"
                  value={legalLastName}
                  onChange={(e) => setLegalLastName(e.target.value)}
                  placeholder="As on official ID"
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="direct-phone" className="text-[13px] font-medium text-gray-700">
                Direct mobile number
              </Label>
              <Input
                id="direct-phone"
                type="tel"
                autoComplete="tel"
                value={accountHolderPhone}
                onChange={(e) => setAccountHolderPhone(e.target.value)}
                placeholder="+61 412 345 678"
                className="h-10"
              />
              <p className="text-[12px] text-gray-500">
                Include the country code. Used only for trust and urgent owner contact.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="role-at-property" className="text-[13px] font-medium text-gray-700">
                  Your role at the property
                </Label>
                <Select
                  id="role-at-property"
                  value={roleAtProperty}
                  onChange={(e) => setRoleAtProperty(e.target.value as AccountHolderPropertyRole | '')}
                  className="h-10"
                >
                  <option value="">Select one</option>
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="country-residence" className="text-[13px] font-medium text-gray-700">
                  Country of residence
                </Label>
                <Select
                  id="country-residence"
                  value={countryOfResidence}
                  onChange={(e) => setCountryOfResidence(e.target.value)}
                  className="h-10"
                >
                  <option value="">Select country</option>
                  {RESIDENCE_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        </section>

        <div className="my-8 h-px bg-gray-200/70" />

        {/* ── Account security row — quiet status pills ──────────────── */}
        <section className="mb-2">
          <h2 className="text-[15px] font-semibold text-gray-900">Account security</h2>
          <p className="mt-1 text-[13px] text-gray-500">Your account&apos;s current safeguards.</p>

          <ul className="mt-5 divide-y divide-gray-200/70 rounded-xl border border-gray-200/80 bg-white">
            <li className="flex items-center justify-between gap-4 px-4 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-gray-400" strokeWidth={1.75} />
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium text-gray-900">Email address</p>
                  <p className="truncate text-[12.5px] text-gray-500">{user?.email}</p>
                </div>
              </div>
              {emailVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11.5px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                  <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
                  Verified
                </span>
              ) : (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11.5px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                  Pending
                </span>
              )}
            </li>

            <li className="px-4 py-3.5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-gray-400" strokeWidth={1.75} />
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-medium text-gray-900">Password</p>
                    <p className="text-[12.5px] text-gray-500">
                      Meets standards if you signed up with a strong password.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasswordReset((v) => !v)}
                  aria-expanded={showPasswordReset}
                  className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[#003580] hover:underline"
                >
                  {showPasswordReset ? 'Cancel' : 'Change'}
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${showPasswordReset ? 'rotate-180' : ''}`}
                    strokeWidth={2}
                  />
                </button>
              </div>

              {showPasswordReset && (
                <div className="mt-4 space-y-3 rounded-lg bg-gray-50/70 p-4">
                  <PasswordStandardsHint className="mb-1" password={newPassword} />
                  <PasswordInput
                    placeholder="Current password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    className="h-10 bg-white"
                  />
                  <PasswordInput
                    placeholder="New password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="h-10 bg-white"
                  />
                  <PasswordInput
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="h-10 bg-white"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUpdatePassword}
                    disabled={updatingPassword || !currentPassword || !newPassword || !confirmPassword}
                  >
                    {updatingPassword ? 'Updating…' : 'Update password'}
                  </Button>
                  {passwordMessage && (
                    <p className="text-[12.5px] text-emerald-700">{passwordMessage}</p>
                  )}
                </div>
              )}
            </li>

            <li className="flex items-center justify-between gap-4 px-4 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-gray-400" strokeWidth={1.75} />
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium text-gray-900">
                    Two-factor authentication
                  </p>
                  <p className="text-[12.5px] text-gray-500">
                    Recommended before payouts. You can add this later in settings.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11.5px] font-medium text-gray-600">
                Optional
              </span>
            </li>
          </ul>
        </section>

        {error && (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-700">
            {error}
          </p>
        )}

        {selfServeExpired && (
          <Button
            type="button"
            variant="outline"
            className="mt-4 w-full"
            onClick={() => router.replace('/manage/list-your-gym?error=verification_link_expired')}
          >
            Request a new verification link
          </Button>
        )}
      </div>

      {/* Sticky footer continue bar — Stripe / Booking partner pattern */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex w-full max-w-[640px] items-center justify-between gap-4 px-4 py-3.5">
          <p className="hidden text-[12.5px] text-gray-500 sm:block">
            {accountHolderComplete
              ? 'All set — confirm your password to continue.'
              : 'Complete the fields above to continue.'}
          </p>
          <Button
            onClick={() => setShowReAuth(true)}
            disabled={
              submitting ||
              !emailVerified ||
              selfServeExpired ||
              !accountHolderComplete
            }
            className="ml-auto inline-flex h-10 items-center gap-2 rounded-full bg-[#003580] px-5 text-[13.5px] font-medium hover:bg-[#002a66] disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Continue'}
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Button>
        </div>
      </div>

      <ReAuthDialog
        open={showReAuth}
        onOpenChange={setShowReAuth}
        title="Confirm your password"
        description="This confirms your identity before completing security onboarding and saving account holder details."
        onSuccess={() => {
          void completeSecurityStep()
        }}
      />
    </div>
  )
}
