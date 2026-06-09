'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { useBootstrapProfileIfMissing } from '@/lib/hooks/use-bootstrap-profile-if-missing'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { PasswordStandardsHint } from '@/components/auth/password-standards-hint'
import { CHECKOUT_GUEST_ONBOARDING_ENTRY } from '@/lib/auth/onboarding-entries'
import { AlertCircle } from 'lucide-react'

function FinishSetupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('booking')
  const { user, profile, loading: authLoading, refreshProfile } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isCheckoutGuest =
    user?.user_metadata?.onboarding_entry === CHECKOUT_GUEST_ONBOARDING_ENTRY

  const profileRecoverFailed = useBootstrapProfileIfMissing({
    authLoading,
    user,
    profile,
    refreshProfile,
  })

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace(
        `/auth/signin?redirect=${encodeURIComponent(
          `/auth/finish-setup${bookingId ? `?booking=${bookingId}` : ''}`
        )}`
      )
      return
    }
    if (!isCheckoutGuest) {
      router.replace('/bookings')
    }
  }, [authLoading, user, isCheckoutGuest, router, bookingId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setPasswordErrors([])

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/auth/password/set-first', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: password }),
      })
      const data = await response.json()

      if (!response.ok) {
        if (Array.isArray(data.details) && data.details.length > 0) {
          setPasswordErrors(data.details)
        } else {
          setError(data.error || 'Failed to set password')
        }
        setSubmitting(false)
        return
      }

      router.replace('/bookings')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to set password')
      setSubmitting(false)
    }
  }

  if (authLoading || profileRecoverFailed || (user && !profile && isCheckoutGuest)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#003580] border-t-transparent" aria-hidden />
      </div>
    )
  }

  if (!user || !isCheckoutGuest) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 md:flex md:items-center md:justify-center">
      <div className="mx-auto w-full max-w-[480px]">
        <div className="mb-6 text-center">
          <span className="inline-flex items-center rounded-full bg-white px-4 py-2 text-base font-bold tracking-tight text-[#003580] shadow-sm ring-1 ring-gray-200">
            CombatStay.com
          </span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white px-6 pb-7 pt-8 shadow-sm md:px-10">
          <h1 className="text-2xl font-semibold text-gray-900">Finish setting up</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create a password for <span className="font-medium text-gray-800">{user.email}</span> to
            save your booking and manage future trips in one place.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <PasswordInput
                id="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (passwordErrors.length > 0) setPasswordErrors([])
                }}
                className="h-11"
                required
                minLength={10}
                autoComplete="new-password"
              />
              {(password.length > 0 || passwordErrors.length > 0) && (
                <PasswordStandardsHint
                  password={password}
                  errors={passwordErrors}
                  className="mt-3"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirm password
              </Label>
              <PasswordInput
                id="confirmPassword"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11"
                required
                minLength={10}
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="h-11 w-full bg-[#003580] text-base font-semibold hover:bg-[#003580]/90"
            >
              {submitting ? 'Saving…' : 'Save and view my bookings'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

function FinishSetupFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#003580] border-t-transparent" aria-hidden />
    </div>
  )
}

export default function FinishSetupPage() {
  return (
    <Suspense fallback={<FinishSetupFallback />}>
      <FinishSetupForm />
    </Suspense>
  )
}
