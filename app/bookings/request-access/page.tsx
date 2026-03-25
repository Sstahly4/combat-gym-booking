'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RequestAccessPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [bookingReference, setBookingReference] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('/api/bookings/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          booking_reference: bookingReference.trim().toUpperCase(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message || 'If a booking exists with that email and reference, a magic link has been sent to your email.')
        setEmail('')
        setBookingReference('')
      } else {
        setError(data.error || 'Failed to request access')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Access Your Booking</CardTitle>
          <CardDescription>
            Enter your email and booking reference to receive a magic link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bookingReference">Booking Reference</Label>
              <Input
                id="bookingReference"
                type="text"
                value={bookingReference}
                onChange={(e) => setBookingReference(e.target.value.toUpperCase())}
                placeholder="BK-XXXX"
                required
              />
              <p className="text-xs text-gray-500">
                Found in your booking confirmation email
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-800 rounded-md text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="p-3 bg-green-50 text-green-800 rounded-md text-sm">
                {message}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Magic Link'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-600 text-center">
              Don't have your booking reference?{' '}
              <Button 
                variant="link" 
                className="p-0 h-auto text-[#003580]"
                onClick={() => router.push('/')}
              >
                Contact Support
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
