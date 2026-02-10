'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { VerificationChecklist } from '@/components/verification-checklist'
import type { Gym, GymImage } from '@/lib/types/database'

interface GymWithImage extends Gym {
  images: GymImage[]
}

export default function ManagePage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [gyms, setGyms] = useState<GymWithImage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      router.replace('/auth/signin')
      return
    }

    if (!profile) {
      router.replace('/auth/role-selection')
      return
    }

    if (profile.role !== 'owner') {
      router.replace('/')
      return
    }

    const fetchGyms = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('gyms')
        .select(`
          *,
          images:gym_images(url, order)
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching gyms:', error)
      } else {
        // Sort images by order for each gym
        const processedData = (data || []).map((gym: any) => {
          if (gym.images && Array.isArray(gym.images)) {
            gym.images.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
          }
          return gym
        })
        setGyms(processedData as any || [])
      }
      setLoading(false)
    }

    fetchGyms()
  }, [user, profile, authLoading, router])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div className="space-y-2">
              <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                <div className="aspect-video bg-gray-200 animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Gym Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Manage your gyms and bookings
            </p>
          </div>
          <Link href="/manage/onboarding">
            <Button>Add New Gym</Button>
          </Link>
        </div>

        {gyms.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Gym Profiles</CardTitle>
              <CardDescription>
                Create your first gym profile to start receiving bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/manage/onboarding">
                <Button>Create Gym Profile</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Verification Checklist for First Gym */}
            {gyms[0] && (
              <VerificationChecklist gym={gyms[0]} />
            )}
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gyms.map((gym) => (
                <Card key={gym.id} className="flex flex-col overflow-hidden">
                  <div className="aspect-video bg-gray-200 relative">
                    {gym.images && gym.images.length > 0 ? (
                      <img
                        src={gym.images[0].url}
                        alt={gym.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{gym.name}</CardTitle>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        gym.verification_status === 'verified' || gym.verification_status === 'trusted' 
                          ? 'bg-green-100 text-green-800' :
                        gym.verification_status === 'draft' 
                          ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {gym.verification_status || 'draft'}
                      </span>
                    </div>
                    <CardDescription>
                      {gym.city}, {gym.country}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="space-y-2 text-sm">
                      <p><strong>Price:</strong> {gym.price_per_day} {gym.currency} / day</p>
                      <p><strong>Disciplines:</strong> {gym.disciplines.slice(0, 3).join(', ')}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2 border-t pt-4 bg-gray-50/50">
                    <Link href={`/manage/bookings`} className="flex-1">
                      <Button variant="outline" className="w-full">Bookings</Button>
                    </Link>
                    <Link href={`/manage/gym/edit?id=${gym.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">Edit</Button>
                    </Link>
                    {!gym.stripe_account_id && (
                      <Link href={`/manage/stripe-connect?gym_id=${gym.id}`} className="flex-1">
                        <Button variant="default" className="w-full">Payments</Button>
                      </Link>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
