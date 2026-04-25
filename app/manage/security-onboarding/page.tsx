'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ReAuthDialog } from '@/components/auth/re-auth-dialog'
import { PasswordStandardsHint } from '@/components/auth/password-standards-hint'
import { RESIDENCE_COUNTRIES } from '@/lib/constants/residence-countries'
import type { AccountHolderPropertyRole } from '@/lib/types/database'
import { CheckCircle2 } from 'lucide-react'

const ROLE_OPTIONS: Array<{ value: AccountHolderPropertyRole; label: string }> = [
  { value: 'owner', label: 'Owner' },
  { value: 'manager', label: 'Manager' },
  { value: 'authorised_operator', label: 'Authorised operator' },
]

export default function SecurityOnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const justVerified = searchParams.get('verified') === '1'
  const { user, profile, loading: authLoading } = useAuth()
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

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/auth/signin')
      return
    }
    if (!profile) {
      router.replace('/auth/role-selection')
      return
    }
    if (profile.role !== 'owner') {
      // When arriving straight from email verification (?verified=1), the callback
      // updates the profile server-side just before redirecting here. The client-side
      // useAuth hook can lag by one render cycle. Give it a brief grace period before
      // bouncing, so a legitimate new owner isn't sent to the homepage.
      if (justVerified) return
      router.replace('/')
    }
  }, [authLoading, user, profile, router, justVerified])

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

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f6f9]">
        <p className="text-muted-foreground">Loading security onboarding...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] py-8 md:py-12">
      <div className="mx-auto w-full max-w-2xl px-3 sm:px-5 lg:px-8">

        {/* Email-verified welcome banner — shown only when arriving from the verification link */}
        {justVerified && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" strokeWidth={1.75} />
            <div>
              <p className="text-sm font-semibold text-green-900">Email verified — welcome to CombatStay Partner Hub!</p>
              <p className="mt-0.5 text-xs text-green-800 leading-snug">
                Your account is active. Complete the details below to start listing your gym.
              </p>
            </div>
          </div>
        )}

        <Card className="overflow-hidden rounded-xl border-gray-200/90 shadow-md">
          <CardHeader className="space-y-2 border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/40 px-6 py-8 md:px-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]/80">
              Account &amp; security
            </p>
            <CardTitle className="text-2xl font-bold tracking-tight text-[#003580] md:text-3xl">
              Security onboarding
            </CardTitle>
            <CardDescription className="text-base text-gray-600">
              We need the <strong>account holder</strong> on record (legal accountability and support contact).
              This is separate from your gym&apos;s public listing details. Payout KYC is still completed in Stripe
              Connect.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 px-6 py-8 md:px-10 md:py-10">
            <div
              id="account-holder-details"
              className="space-y-4 rounded-xl border-2 border-[#003580]/20 bg-white p-5 shadow-sm md:p-6"
            >
              <div>
                <h2 className="text-lg font-bold text-[#003580] md:text-xl">Account holder details</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Who is responsible for this listing if there is a dispute or we need to reach someone directly.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="legal-first">Legal first name</Label>
                  <Input
                    id="legal-first"
                    autoComplete="given-name"
                    value={legalFirstName}
                    onChange={(e) => setLegalFirstName(e.target.value)}
                    placeholder="As on official ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legal-last">Legal last name</Label>
                  <Input
                    id="legal-last"
                    autoComplete="family-name"
                    value={legalLastName}
                    onChange={(e) => setLegalLastName(e.target.value)}
                    placeholder="As on official ID"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="direct-phone">Direct mobile number</Label>
                <Input
                  id="direct-phone"
                  type="tel"
                  autoComplete="tel"
                  value={accountHolderPhone}
                  onChange={(e) => setAccountHolderPhone(e.target.value)}
                  placeholder="Your mobile, not the gym reception"
                />
                <p className="text-xs text-muted-foreground">
                  Include country code where possible (e.g. +61 …). We use this for trust and urgent owner contact
                  only.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role-at-property">Your role at the property</Label>
                <Select
                  id="role-at-property"
                  value={roleAtProperty}
                  onChange={(e) => setRoleAtProperty(e.target.value as AccountHolderPropertyRole | '')}
                >
                  <option value="">Select one</option>
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country-residence">Country of residence</Label>
                <Select
                  id="country-residence"
                  value={countryOfResidence}
                  onChange={(e) => setCountryOfResidence(e.target.value)}
                >
                  <option value="">Select country</option>
                  {RESIDENCE_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-muted-foreground">
                  Pre-filled from your connection when available — please confirm or change if needed.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200/90 bg-white p-5 shadow-sm md:p-6">
              <p className="font-medium text-gray-900">Email verification</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {user?.email_confirmed_at
                  ? 'Your email is verified.'
                  : 'Please verify your email from the link in your inbox before continuing.'}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200/90 bg-white p-5 shadow-sm md:p-6">
              <p className="font-medium text-gray-900">Password standards</p>
              <PasswordStandardsHint className="mt-2" />
            </div>

            <div className="rounded-xl border border-gray-200/90 bg-white p-5 shadow-sm md:p-6">
              {!showPasswordReset ? (
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(true)}
                  className="text-sm font-medium text-[#003580] hover:underline"
                >
                  Reset password if it doesn&apos;t meet the standards above
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">Reset password</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Only needed if the password you set at signup doesn&apos;t meet the standards above.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordReset(false)
                        setCurrentPassword('')
                        setNewPassword('')
                        setConfirmPassword('')
                        setPasswordMessage(null)
                      }}
                      className="text-xs font-medium text-muted-foreground hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                  <PasswordInput
                    placeholder="Current password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                  />
                  <PasswordInput
                    placeholder="New password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                  />
                  <PasswordInput
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                  <Button
                    variant="outline"
                    onClick={handleUpdatePassword}
                    disabled={updatingPassword || !currentPassword || !newPassword || !confirmPassword}
                  >
                    {updatingPassword ? 'Updating...' : 'Update password'}
                  </Button>
                  {passwordMessage && <p className="text-sm text-green-700">{passwordMessage}</p>}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-200/90 bg-white p-5 shadow-sm md:p-6">
              <p className="font-medium text-gray-900">Two-factor authentication (optional)</p>
              <p className="mt-2 text-sm text-muted-foreground">
                You can enable TOTP now or later from settings to better protect payout actions.
              </p>
            </div>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
            )}

            <Button
              onClick={() => setShowReAuth(true)}
              disabled={
                submitting ||
                !Boolean(user?.email_confirmed_at) ||
                selfServeExpired ||
                !accountHolderComplete
              }
              className="w-full bg-[#003580] hover:bg-[#002a66]"
            >
              {submitting ? 'Saving...' : 'Confirm password and continue'}
            </Button>
            {!accountHolderComplete && (
              <p className="text-center text-xs text-muted-foreground">
                Complete all account holder fields above to continue.
              </p>
            )}
            {selfServeExpired && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.replace('/manage/list-your-gym?error=verification_link_expired')}
              >
                Request a new verification link
              </Button>
            )}
          </CardContent>
        </Card>
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
