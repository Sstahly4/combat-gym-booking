'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function StripeConnectPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const success = searchParams.get('success')
  const refresh = searchParams.get('refresh')

  useEffect(() => {
    if (!user || profile?.role !== 'owner') {
      router.push('/')
    }
  }, [user, profile])

  const handleConnect = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/create-account', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account link')
      }

      // Redirect to Stripe onboarding
      window.location.href = data.url
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Payment Setup Complete!</CardTitle>
              <CardDescription>
                Your Stripe account has been successfully connected. You can now receive payments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/manage')}>
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Setup Stripe Payments</CardTitle>
            <CardDescription>
              Connect your Stripe account to receive payments from bookings. This process is secure and handled by Stripe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <p className="text-sm text-muted-foreground">
                By connecting your Stripe account, you'll be able to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Receive payments directly to your bank account</li>
                <li>View your earnings in the Stripe dashboard</li>
                <li>Get paid automatically when bookings are confirmed</li>
              </ul>
            </div>

            <Button onClick={handleConnect} disabled={loading} className="w-full">
              {loading ? 'Connecting...' : 'Connect Stripe Account'}
            </Button>

            {refresh && (
              <p className="mt-4 text-sm text-muted-foreground">
                If you need to complete your account setup, click the button above.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function StripeConnectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <StripeConnectPageContent />
    </Suspense>
  )
}
