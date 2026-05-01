'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'
import { validatePasswordRules } from '@/lib/auth/password-rules'
import { PasswordStandardsHint } from '@/components/auth/password-standards-hint'

function SignInPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect')
  const intent = searchParams.get('intent')
  const isPartnerIntent = intent === 'partner' || intent === 'owner'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  // 'signin' = default; 'signup' = auto-switched when no account found
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [authStep, setAuthStep] = useState<'email' | 'password'>('email')

  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // If the server still rejects /manage/* (no cookie sync), auto-assign would loop forever.
          if (redirectUrl) {
            const bounceKey = `auth-redirect-bounce:${redirectUrl}`
            const last = sessionStorage.getItem(bounceKey)
            const now = Date.now()
            if (last && now - Number(last) < 12_000) {
              await supabase.auth.signOut()
              sessionStorage.removeItem(bounceKey)
              setCheckingSession(false)
              setError(
                'Your browser session does not match the server yet. Sign in again below to continue to Partner Hub.'
              )
              return
            }
            sessionStorage.setItem(bounceKey, String(now))
            window.location.assign(redirectUrl)
            return
          }
          await redirectBasedOnProfile(user.id)
          return
        }
      } catch {
        // Fall through and show the form instead of hanging on skeleton.
      }
      setCheckingSession(false)
    }
    void checkSession()
  }, [redirectUrl])

  const redirectBasedOnProfile = async (userId: string) => {
    const supabase = createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (isPartnerIntent) {
      router.replace('/owners')
      return
    }

    if (profile?.role === 'owner') {
      // Use /owners as the stable owner hub when no explicit redirect is provided.
      router.replace(redirectUrl || '/owners')
    } else if (profile?.role === 'admin') {
      router.replace('/admin')
    } else {
      router.replace(redirectUrl || '/')
    }
  }

  const handleGoogleSignIn = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectUrl || '/')}`,
      },
    })
  }

  const handleFacebookSignIn = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectUrl || '/')}`,
      },
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setPasswordErrors([])

    const normalizedEmail = email.trim().toLowerCase()
    if (authStep === 'email') {
      if (!normalizedEmail) {
        setError('Enter your email address to continue.')
        return
      }
      setEmail(normalizedEmail)
      setAuthStep('password')
      return
    }

    const supabase = createClient()

    if (mode === 'signup') {
      const validation = validatePasswordRules(password)
      if (!validation.valid) {
        setPasswordErrors(validation.errors)
        return
      }

      setLoading(true)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })

      if (signUpError) {
        if (
          signUpError.message.toLowerCase().includes('already registered') ||
          signUpError.message.toLowerCase().includes('already exists')
        ) {
          setMode('signin')
          setError('An account with this email already exists. Enter your password to sign in.')
        } else {
          setError(signUpError.message)
        }
        setLoading(false)
        return
      }

      if (data.user) {
        try {
          await fetch('/api/auth/update-profile-role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: 'fighter', full_name: fullName }),
          })
        } catch {}
        if (redirectUrl) {
          window.location.assign(redirectUrl)
        } else {
          router.push('/')
        }
      }
      setLoading(false)
      return
    }

    // Sign-in attempt
    setLoading(true)
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      if (signInError.message.toLowerCase().includes('invalid login credentials')) {
        // No account found for this email — switch to registration mode
        setMode('signup')
        setPassword('')
        setError(null)
        setLoading(false)
        return
      }
      setError(signInError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      try {
        await fetch('/api/auth/security/record-sign-in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_hint: 'password' }),
        })
      } catch {
        // non-blocking
      }
      // Evaluate the (briefly visible) plaintext against the current password
      // policy so we can flag legacy accounts whose stored password no longer
      // meets the rules. Non-blocking — never prevents sign-in.
      try {
        await fetch('/api/auth/evaluate-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        })
      } catch {
        // non-blocking
      }
      if (redirectUrl) {
        sessionStorage.removeItem(`auth-redirect-bounce:${redirectUrl}`)
        window.location.assign(redirectUrl)
      } else {
        await redirectBasedOnProfile(data.user.id)
      }
    }
    setLoading(false)
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-[480px] space-y-4 px-4">
          <div className="h-5 w-36 bg-gray-200 rounded animate-pulse mx-auto" />
          <div className="border border-gray-200 rounded-2xl p-10 bg-white space-y-4">
            <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="h-11 w-full bg-gray-200 rounded-full animate-pulse" />
            <div className="h-px w-full bg-gray-200" />
            <div className="h-11 w-full bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-11 w-full bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-11 w-full bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white px-6 pb-28 pt-10 md:flex md:items-center md:justify-center md:bg-gray-50 md:px-4 md:py-16">
      <div className="mx-auto w-full max-w-[480px]">
        <div className="mb-8 text-center">
          <span className="text-base font-bold tracking-tight text-[#003580]">CombatStay.com</span>
        </div>

        <div className="bg-white md:rounded-2xl md:border md:border-gray-200 md:px-10 md:pb-8 md:pt-10 md:shadow-sm">
          <h1 className="mb-8 text-center text-[1.9rem] font-semibold leading-tight tracking-tight text-gray-950 md:text-left md:text-[1.75rem]">
            {mode === 'signup'
              ? isPartnerIntent
                ? 'Create your partner account'
                : 'Create your account'
              : isPartnerIntent
                ? 'Partner sign in'
                : 'Log in or sign up'}
          </h1>

          {mode === 'signup' && (
            <div className="mb-5 rounded-xl border border-[#003580]/15 bg-[#003580]/[0.04] p-3.5">
              <p className="text-sm leading-snug text-gray-800">
                No account found for <span className="font-medium">{email}</span>. Add your name and choose a password to create one.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {authStep === 'email' ? (
              <div>
                <Label htmlFor="email" className="sr-only">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError(null)
                    if (mode === 'signup') setMode('signin')
                  }}
                  className="h-14 rounded-xl border-gray-400 px-4 text-base shadow-none focus-visible:ring-[#003580]"
                  autoComplete="email"
                  autoFocus
                  required
                />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{email}</p>
                  </div>
                  <button
                    type="button"
                    className="ml-3 text-sm font-medium text-[#003580] hover:underline"
                    onClick={() => {
                      setAuthStep('email')
                      setMode('signin')
                      setPassword('')
                      setPasswordErrors([])
                      setError(null)
                    }}
                  >
                    Edit
                  </button>
                </div>

                {mode === 'signup' && (
                  <div>
                    <Label htmlFor="fullName" className="sr-only">
                      Full name
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-14 rounded-xl border-gray-400 px-4 text-base shadow-none focus-visible:ring-[#003580]"
                      autoComplete="name"
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="sr-only">
                      Password
                    </Label>
                    {mode === 'signin' && (
                      <Link
                        href="/auth/forgot-password"
                        className="ml-auto text-sm font-medium text-[#003580] hover:underline"
                      >
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <PasswordInput
                    id="password"
                    placeholder={mode === 'signup' ? 'Create a password' : 'Password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (passwordErrors.length > 0) setPasswordErrors([])
                    }}
                    className="h-14 rounded-xl border-gray-400 px-4 text-base shadow-none focus-visible:ring-[#003580]"
                    required
                    minLength={mode === 'signup' ? 10 : undefined}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    autoFocus
                  />
                  {mode === 'signup' && (password.length > 0 || passwordErrors.length > 0) && (
                    <PasswordStandardsHint
                      password={password}
                      errors={passwordErrors}
                      className="mt-3"
                    />
                  )}
                </div>
              </>
            )}

            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-14 w-full rounded-xl bg-[#003580] text-base font-semibold text-white transition hover:bg-[#002d6b] disabled:opacity-60"
            >
              {authStep === 'email'
                ? 'Continue'
                : loading
                  ? mode === 'signup'
                    ? 'Creating account...'
                    : 'Signing in...'
                  : mode === 'signup'
                    ? 'Create account'
                    : 'Log in'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-sm text-gray-500">or</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="flex h-14 items-center justify-center rounded-xl border border-gray-300 bg-white transition hover:bg-gray-50 active:bg-gray-100"
              aria-label="Continue with Google"
            >
              <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={handleFacebookSignIn}
              className="flex h-14 items-center justify-center rounded-xl border border-gray-300 bg-white transition hover:bg-gray-50 active:bg-gray-100"
              aria-label="Continue with Facebook"
            >
              <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden>
                <path fill="#1877F2" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.883v2.271h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
              </svg>
            </button>
          </div>

          <p className="mt-6 text-center text-[11px] leading-relaxed text-gray-500">
            By signing in or creating an account, you agree with our{' '}
            <Link href="/terms" className="font-medium text-[#003580] hover:underline">
              Terms &amp; conditions
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="font-medium text-[#003580] hover:underline">
              Privacy statement
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-8 h-8 border-2 border-[#003580] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SignInPageContent />
    </Suspense>
  )
}
