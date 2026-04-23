'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { validatePasswordRules } from '@/lib/auth/password-rules'
import { PasswordStandardsHint } from '@/components/auth/password-standards-hint'

/**
 * Users arrive here from the "forgot password" email after /auth/callback
 * exchanged the recovery code for a session. We let them set a new password
 * (validated against the current rules) and then bounce them to sign-in.
 */

function ResetPasswordInner() {
  const router = useRouter()
  const [sessionReady, setSessionReady] = useState<'checking' | 'ok' | 'missing'>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let cancelled = false
    const check = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return
      setSessionReady(session ? 'ok' : 'missing')
    }
    void check()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setPasswordErrors([])

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    const validation = validatePasswordRules(password)
    if (!validation.valid) {
      setPasswordErrors(validation.errors)
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message || 'Could not update password. Request a new reset link and try again.')
      setLoading(false)
      return
    }

    // Flip the policy flag + clear any open "please update" owner bell row.
    try {
      await fetch('/api/auth/evaluate-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
    } catch {
      // non-blocking
    }

    // Sign out so the user signs in fresh with the new password — this also
    // clears the transient recovery session on this device.
    await supabase.auth.signOut()

    setSuccess(true)
    setLoading(false)
    setTimeout(() => {
      router.push('/auth/signin')
    }, 2500)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[480px]">
        <div className="text-center mb-8">
          <span className="text-base font-bold text-[#003580] tracking-tight">
            CombatBooking.com
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-10 pt-10 pb-8">
          <h1 className="text-[1.75rem] font-semibold leading-[1.25] tracking-tight text-black mb-2">
            Choose a new password
          </h1>

          {sessionReady === 'checking' && (
            <div className="mt-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-[#003580] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {sessionReady === 'missing' && (
            <div className="mt-4 space-y-5">
              <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  This reset link is invalid or has expired. Request a new one below.
                </div>
              </div>
              <Link
                href="/auth/forgot-password"
                className="inline-flex items-center justify-center w-full h-11 bg-[#003580] hover:bg-[#002d6b] text-white text-sm font-medium rounded-full transition"
              >
                Request a new link
              </Link>
            </div>
          )}

          {sessionReady === 'ok' && !success && (
            <>
              <p className="text-sm text-gray-500 mb-6">
                Create a strong password. You&apos;ll use it to sign in next time.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="new-password" className="text-sm font-medium text-gray-700">
                    New password
                  </Label>
                  <PasswordInput
                    id="new-password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (passwordErrors.length > 0) setPasswordErrors([])
                    }}
                    className="h-11"
                    required
                    minLength={10}
                    placeholder="Choose a strong password"
                  />
                  <PasswordStandardsHint errors={passwordErrors} className="mt-2" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
                    Confirm new password
                  </Label>
                  <PasswordInput
                    id="confirm-password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="h-11"
                    required
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !password || !confirm}
                  className="mt-1 w-full h-11 bg-[#003580] hover:bg-[#002d6b] disabled:opacity-60 text-white text-sm font-medium rounded-full transition"
                >
                  {loading ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </>
          )}

          {success && (
            <div className="mt-4 space-y-5">
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-700 mt-0.5" />
                <div className="text-sm text-green-900 leading-relaxed">
                  <p className="font-medium">Password updated.</p>
                  <p className="mt-1">Redirecting you to sign in…</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-8 h-8 border-2 border-[#003580] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  )
}
