'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import type { Gym, GymImage } from '@/lib/types/database'

interface GymWithImage extends Gym {
  images: GymImage[]
}

export default function AdminGymsPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [gyms, setGyms] = useState<GymWithImage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      router.replace('/auth/signin?redirect=/admin/gyms')
      return
    }

    if (profile?.role !== 'admin') {
      router.replace('/')
      return
    }

    fetchGyms()
  }, [user, profile, authLoading])

  const fetchGyms = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('gyms')
      .select(`
        *,
        images:gym_images(url, order)
      `)
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse mb-8" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                <div className="aspect-video bg-gray-200 animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
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
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Gyms</h1>
            <p className="text-gray-600 mt-2">
              Manage and edit all gyms in the system
            </p>
          </div>
          <Link href="/admin">
            <Button variant="outline">Back to Admin</Button>
          </Link>
        </div>

        {gyms.length === 0 ? (
          <Card className="border border-gray-300">
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">No gyms found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gyms.map((gym) => (
              <Card key={gym.id} className="flex flex-col overflow-hidden border border-gray-300">
                <div className="aspect-video bg-gray-200 relative">
                  {gym.images && gym.images.length > 0 ? (
                    <img
                      src={gym.images[0].url}
                      alt={gym.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl text-gray-900">{gym.name}</CardTitle>
                    <div className="flex flex-col gap-1 items-end">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        (gym as any).verification_status === 'verified' || (gym as any).verification_status === 'trusted'
                          ? 'bg-green-100 text-green-800' :
                        (gym as any).verification_status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {(gym as any).verification_status || 'draft'}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        gym.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                        gym.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {gym.status}
                      </span>
                    </div>
                  </div>
                  <CardDescription className="text-gray-600">
                    {gym.city}, {gym.country}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><strong>Price:</strong> {gym.price_per_day} {gym.currency} / day</p>
                    {gym.disciplines && gym.disciplines.length > 0 && (
                      <p><strong>Disciplines:</strong> {gym.disciplines.slice(0, 3).join(', ')}</p>
                    )}
                    {gym.owner_id && (
                      <p className="text-xs text-gray-500">Owner ID: {gym.owner_id.slice(0, 8)}...</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 border-t border-gray-200 pt-4 bg-gray-50/50">
                  <div className="flex gap-2 w-full">
                    <Link href={`/manage/gym/edit?id=${gym.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">Edit</Button>
                    </Link>
                    <Link href={`/gyms/${gym.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">View</Button>
                    </Link>
                  </div>
                  {(gym as any).verification_status === 'draft' && (
                    <Button 
                      variant="default" 
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={async () => {
                        if (confirm('Verify this gym? All requirements must be met (Stripe Connect, Google Maps, Social Media).')) {
                          try {
                            const response = await fetch(`/api/gyms/${gym.id}/verify`, { method: 'POST' })
                            const data = await response.json()
                            if (data.success) {
                              alert('Gym verified successfully!')
                              window.location.reload()
                            } else {
                              alert(`Verification failed: ${data.error || 'Requirements not met'}\n\nMissing: ${JSON.stringify(data.requirements, null, 2)}`)
                            }
                          } catch (error) {
                            alert('Error verifying gym. Please try again.')
                          }
                        }
                      }}
                    >
                      Verify Gym
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
