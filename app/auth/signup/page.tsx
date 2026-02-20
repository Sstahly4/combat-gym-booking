'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const intent = searchParams.get('intent') // 'owner' or null
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (signUpError) {
      // Handle specific error cases
      if (signUpError.message.includes('rate limit') || signUpError.message.includes('email rate limit')) {
        setError('Email rate limit exceeded. This is a Supabase email service limit. Please configure Resend SMTP in Supabase settings to use your Resend account instead. See SUPABASE_EMAIL_SETUP.md for instructions.')
      } else if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
        setError('An account with this email already exists. Please sign in instead.')
      } else {
        setError(signUpError.message)
      }
      setLoading(false)
      return
    }

    if (data.user) {
      // Determine role
      const role = intent === 'owner' ? 'owner' : 'fighter'

      // Wait a moment for the trigger to create the profile
      // This handles the race condition where trigger might not have completed yet
      await new Promise(resolve => setTimeout(resolve, 500))

      // Use API route to update profile (more reliable than client-side upsert)
      // This avoids RLS issues and handles race conditions better
      try {
        const response = await fetch('/api/auth/update-profile-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role,
            full_name: fullName,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error('Profile update error:', errorData)
          setError(`Failed to create profile: ${errorData.error || 'Unknown error'}. Please try again or contact support.`)
          setLoading(false)
          return
        }
      } catch (fetchError: any) {
        console.error('Profile update request error:', fetchError)
        setError('Failed to create profile. Please try again or contact support.')
        setLoading(false)
        return
      }

      // Check if email verification is required
      // Supabase may require email confirmation depending on project settings
      // Note: Even if email confirmation fails due to rate limits, we still create the account
      // The user can verify their email later
      if (data.user.email_confirmed_at) {
        // Email already confirmed, proceed
        if (role === 'owner') {
          router.push('/manage/onboarding')
        } else {
          router.push('/')
        }
      } else {
        // Email verification required but may not have been sent due to rate limits
        // Still allow user to proceed - they can verify email later
        if (role === 'owner') {
          // Redirect to onboarding - they can verify email later if needed
          router.push('/manage/onboarding?verify_email=true')
        } else {
          router.push('/?verify_email=true')
        }
      }
    } else {
      // User creation failed or email confirmation required
      // This might happen if email confirmation is required but rate limited
      setError('Account created but email confirmation may be delayed due to rate limits. Please check your email in a few minutes, or contact support if you need immediate assistance.')
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>
          {intent === 'owner' ? 'List Your Gym' : 'Create Account'}
        </CardTitle>
        <CardDescription>
          {intent === 'owner' 
            ? 'Create a partner account to start managing your gym' 
            : 'Sign up to book training camps worldwide'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </Button>
          <div className="text-center text-sm">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-full max-w-md space-y-4">
            <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mx-auto" />
            <div className="border border-gray-300 rounded-lg p-6 bg-white space-y-4">
              <div className="h-11 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-11 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-11 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      }>
        <SignUpForm />
      </Suspense>
    </div>
  )
}
