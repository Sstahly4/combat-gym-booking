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
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Determine role
      const role = intent === 'owner' ? 'owner' : 'fighter'

      // Create/update profile with proper conflict handling
      // The trigger creates a profile with role='fighter', so we upsert to update it
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          id: data.user.id,
          role: role,
          full_name: fullName,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        setError('Failed to create profile. Please try again.')
        setLoading(false)
        return
      }

      // Check if email verification is required
      // Supabase may require email confirmation depending on project settings
      if (data.user.email_confirmed_at) {
        // Email already confirmed, proceed
        if (role === 'owner') {
          router.push('/manage/onboarding')
        } else {
          router.push('/')
        }
      } else {
        // Email verification required
        if (role === 'owner') {
          // Show message that they need to verify email
          setError(null)
          // Still redirect but onboarding page will check verification
          router.push('/manage/onboarding?verify_email=true')
        } else {
          router.push('/?verify_email=true')
        }
      }
    } else {
      // User creation failed or email confirmation required
      setError('Please check your email to confirm your account before continuing.')
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
