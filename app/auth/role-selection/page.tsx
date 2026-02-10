'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function RoleSelectionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleRoleSelection = async (role: 'fighter' | 'owner') => {
    setLoading(true)
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/signin')
      return
    }

    await supabase
      .from('profiles')
      .upsert({ 
        id: user.id,
        role: role,
        updated_at: new Date().toISOString()
      })
      .select()

    if (role === 'owner') {
      router.push('/manage/onboarding')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-8">Choose Your Role</h1>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleRoleSelection('fighter')}>
            <CardHeader>
              <CardTitle>Fighter / Trainee</CardTitle>
              <CardDescription>
                Browse and book training camps at combat sports gyms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li>• Browse gyms and training camps</li>
                <li>• Request bookings</li>
                <li>• Manage your bookings</li>
                <li>• Leave reviews</li>
              </ul>
              <Button className="w-full" disabled={loading}>
                Continue as Fighter
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleRoleSelection('owner')}>
            <CardHeader>
              <CardTitle>Gym Owner</CardTitle>
              <CardDescription>
                List your gym and manage bookings from fighters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li>• Create and manage gym profile</li>
                <li>• Accept or decline bookings</li>
                <li>• Receive payments</li>
                <li>• View earnings</li>
              </ul>
              <Button className="w-full" disabled={loading}>
                Continue as Owner
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
