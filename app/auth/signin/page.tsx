'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'

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
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  // 'signin' = default; 'signup' = auto-switched when no account found
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

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
                'Your browser session does not match the server yet. Sign in again below to continue to the owner area.'
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
    setLoading(true)

    const supabase = createClient()

    if (mode === 'signup') {
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[480px]">

        {/* Brand */}
        <div className="text-center mb-8">
          <span className="text-base font-bold text-[#003580] tracking-tight">
            CombatBooking.com
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-10 pt-10 pb-8">

          <h1
            className={
              isPartnerIntent
                ? 'text-[1.95rem] font-extrabold leading-[1.15] tracking-tight text-black mb-7'
                : 'text-[1.75rem] font-semibold leading-[1.25] tracking-tight text-black mb-8'
            }
          >
            {mode === 'signup'
              ? (isPartnerIntent ? 'Create your partner account' : 'Create your account')
              : (isPartnerIntent ? 'Partner sign in' : 'Sign in or create an account')}
          </h1>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-gray-300 bg-white px-4 py-3.5 text-sm font-medium text-gray-900 transition hover:bg-gray-50 active:bg-gray-100"
          >
            <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          {/* Facebook */}
          <button
            type="button"
            onClick={handleFacebookSignIn}
            className="mt-3 flex w-full items-center justify-center gap-3 rounded-full border border-gray-300 bg-white px-4 py-3.5 text-sm font-medium text-gray-900 transition hover:bg-gray-50 active:bg-gray-100"
          >
            <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden>
              <path fill="#1877F2" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.883v2.271h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
            </svg>
            Continue with Facebook
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Auto-switch notice */}
          {mode === 'signup' && (
            <div className="mb-5 p-3.5 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-sm text-blue-800 leading-snug">
                No account found for <span className="font-medium">{email}</span>. Fill in your name and choose a password to create one.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                  Full name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Jane Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (mode === 'signup') setMode('signin')
                }}
                className="h-11"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={mode === 'signup' ? 'Choose a password (min. 6 characters)' : 'Your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
                required
                minLength={mode === 'signup' ? 6 : undefined}
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
              disabled={loading}
              className="mt-1 w-full h-11 bg-[#003580] hover:bg-[#002d6b] disabled:opacity-60 text-white text-sm font-medium rounded-full transition"
            >
              {loading
                ? mode === 'signup' ? 'Creating account…' : 'Signing in…'
                : mode === 'signup' ? 'Create account' : 'Continue'}
            </button>
          </form>

          {/* Fine print */}
          <p className="mt-6 text-[11px] text-gray-400 leading-relaxed text-center">
            By signing in or creating an account, you agree with our{' '}
            <Link href="/terms" className="text-[#003580] hover:underline">
              Terms &amp; conditions
            </Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-[#003580] hover:underline">
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
