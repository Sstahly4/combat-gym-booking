'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, ArrowLeft, Mail } from 'lucide-react'

function ForgotPasswordInner() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    // Note: we deliberately do NOT surface whether the email exists. We always
    // show the same generic confirmation to prevent account-enumeration. Rate
    // limiting for this endpoint is handled at the Supabase project level.
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent('/auth/reset-password')}`,
      },
    )

    // We still catch transport-level issues so the user isn't left hanging on
    // a spinner if our API is unreachable. Per-account errors are swallowed.
    if (resetError && /network|fetch|failed to fetch/i.test(resetError.message)) {
      setError('Could not reach our servers. Check your connection and try again.')
      setLoading(false)
      return
    }

    setSubmitted(true)
    setLoading(false)
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
            Reset your password
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Enter your email and we&apos;ll send you a link to choose a new password.
          </p>

          {submitted ? (
            <div className="space-y-5">
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <Mail className="w-5 h-5 flex-shrink-0 text-green-700 mt-0.5" />
                <div className="text-sm text-green-900 leading-relaxed">
                  <p className="font-medium">Check your inbox.</p>
                  <p className="mt-1">
                    If an account exists for <span className="font-medium">{email}</span>, we&apos;ve sent
                    a password reset link. It expires in 1 hour. Don&apos;t forget to check spam.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false)
                  setEmail('')
                }}
                className="text-sm font-medium text-[#003580] hover:underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  required
                  autoFocus
                  autoComplete="email"
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
                disabled={loading || !email.trim()}
                className="mt-1 w-full h-11 bg-[#003580] hover:bg-[#002d6b] disabled:opacity-60 text-white text-sm font-medium rounded-full transition"
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-gray-100">
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-8 h-8 border-2 border-[#003580] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ForgotPasswordInner />
    </Suspense>
  )
}
