'use client'

import { useState } from 'react'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/hooks/use-auth'

export default function ListYourGymEntryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [gymName, setGymName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (user && profile?.role === 'owner') {
      router.replace('/manage/security-onboarding')
    }
  }, [authLoading, user, profile, router])

  useEffect(() => {
    const errorCode = searchParams.get('error')
    if (errorCode === 'verification_link_expired') {
      setError('Your verification link expired after 24 hours. Enter your details again to receive a new link.')
      setSuccess(false)
    }
  }, [searchParams])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/onboarding/self-serve/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          full_name: fullName,
          gym_name: gymName,
          phone,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to start onboarding')
        setLoading(false)
        return
      }
      setSuccess(true)
      setLoading(false)
    } catch (submitError: any) {
      setError(submitError?.message || 'Failed to start onboarding')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>List your gym</CardTitle>
            <CardDescription>
              Start self-serve owner onboarding. We will send a verification link to your email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                Verification link sent. Open the email within 24 hours to continue to security onboarding.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full name</Label>
                  <Input
                    id="full-name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gym-name">Gym name</Label>
                  <Input
                    id="gym-name"
                    value={gymName}
                    onChange={(event) => setGymName(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    required
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Sending link...' : 'Send verification link'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
