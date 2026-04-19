'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/hooks/use-auth'

interface InviteState {
  valid: boolean
  expired: boolean
  used: boolean
  emailMismatch: boolean
}

export default function OwnerInviteAcceptPage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [state, setState] = useState<InviteState | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace(`/auth/signin?redirect=${encodeURIComponent(`/manage/invite/${token}`)}`)
      return
    }

    const fetchInvite = async () => {
      try {
        const response = await fetch(`/api/onboarding/invite/${token}`)
        const data = await response.json()
        if (!response.ok) {
          setError(data.error || 'Unable to load invite')
          setLoading(false)
          return
        }
        setState(data as InviteState)
      } catch (fetchError: any) {
        setError(fetchError?.message || 'Unable to load invite')
      } finally {
        setLoading(false)
      }
    }

    void fetchInvite()
  }, [authLoading, user, token, router])

  const acceptInvite = async () => {
    setAccepting(true)
    setError(null)
    try {
      const response = await fetch(`/api/onboarding/invite/${token}`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Unable to accept invite')
        setAccepting(false)
        return
      }
      router.replace('/manage/security-onboarding')
    } catch (acceptError: any) {
      setError(acceptError?.message || 'Unable to accept invite')
      setAccepting(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-muted-foreground">Loading invite...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Admin owner invite</CardTitle>
            <CardDescription>Accept this invite to continue into security onboarding.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}

            {state && !state.valid ? (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>This invite is not valid.</p>
                {state.expired && <p>- The invite has expired.</p>}
                {state.used && <p>- The invite has already been used.</p>}
                {state.emailMismatch && <p>- Sign in with the invited email address.</p>}
              </div>
            ) : (
              <Button onClick={acceptInvite} disabled={accepting || !state?.valid} className="w-full">
                {accepting ? 'Accepting...' : 'Accept invite'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
