'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Building2, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle, 
  CreditCard,
  Shield,
  Eye,
  Settings,
  BarChart3,
  Users,
  Calendar,
  Clock,
  TrendingUp,
  FileText,
  Search,
  Filter,
  X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { GymVerificationCard } from '@/components/admin/gym-verification-card'
import { BookingDetailsModal } from '@/components/admin/booking-details-modal'
import type { Gym, Booking } from '@/lib/types/database'

export default function AdminPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [pendingGyms, setPendingGyms] = useState<Gym[]>([])
  const [unverifiedGyms, setUnverifiedGyms] = useState<Gym[]>([])
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [allGyms, setAllGyms] = useState<Gym[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verifyingGymId, setVerifyingGymId] = useState<string | null>(null)
  const [verifyingAll, setVerifyingAll] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  
  // MVP ONLY: Manual review creation state - REMOVE BEFORE SHIPPING
  const [showManualReview, setShowManualReview] = useState(false)
  const [manualReviewForm, setManualReviewForm] = useState({
    gym_id: '',
    rating: '5',
    comment: '',
    reviewer_name: ''
  })

  const fetchData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const supabase = createClient()
      
      // Fetch all data in parallel for better performance
      const [gymsResult, draftGymsResult, approvedGymsResult, bookingsResult] = await Promise.allSettled([
        supabase
          .from('gyms')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
        supabase
          .from('gyms')
          .select('*')
          .eq('verification_status', 'draft')
          .order('created_at', { ascending: false }),
        supabase
          .from('gyms')
          .select('*')
          .eq('status', 'approved')
          .order('name', { ascending: true }),
        supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)
      ])

      // Handle results
      if (gymsResult.status === 'fulfilled') {
        const { data: gyms, error: gymsError } = gymsResult.value
        if (gymsError) {
          console.error('Error fetching pending gyms:', gymsError)
        }
        setPendingGyms(gyms || [])
      }

      if (draftGymsResult.status === 'fulfilled') {
        const { data: draftGyms, error: draftGymsError } = draftGymsResult.value
        if (draftGymsError) {
          console.error('Error fetching draft gyms:', draftGymsError)
        }
        setUnverifiedGyms(draftGyms || [])
      }

      if (approvedGymsResult.status === 'fulfilled') {
        const { data: approvedGyms, error: approvedGymsError } = approvedGymsResult.value
        if (approvedGymsError) {
          console.error('Error fetching approved gyms:', approvedGymsError)
        }
        setAllGyms(approvedGyms || [])
      }

      if (bookingsResult.status === 'fulfilled') {
        const { data: bookings, error: bookingsError } = bookingsResult.value
        if (bookingsError) {
          console.error('Error fetching bookings:', bookingsError)
        }
        setRecentBookings(bookings || [])
      }

      // Check for any rejected promises
      const rejected = [gymsResult, draftGymsResult, approvedGymsResult, bookingsResult]
        .filter(r => r.status === 'rejected')
      
      if (rejected.length > 0) {
        console.error('Some data fetches failed:', rejected)
        setError('Some data failed to load. Please refresh.')
      }
    } catch (err: any) {
      console.error('Error in fetchData:', err)
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    // Safety timeout - if authLoading takes too long, proceed anyway
    const authTimeout = setTimeout(() => {
      if (loading) {
        console.warn('Auth loading timeout - proceeding with current state')
        setLoading(false)
        // If we have user data but authLoading is stuck, proceed
        if (user && profile) {
          if (profile.role === 'admin') {
            fetchData()
          }
        } else if (!user) {
          router.push('/auth/signin?redirect=/admin')
        }
      }
    }, 3000) // Reduced timeout to 3 seconds

    if (authLoading) {
      return () => clearTimeout(authTimeout)
    }
    
    clearTimeout(authTimeout)

    if (!user) {
      router.push('/auth/signin?redirect=/admin')
      setLoading(false)
      return
    }

    if (profile?.role !== 'admin') {
      setLoading(false)
      return
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profile?.role, authLoading])

  const handleVerifyGym = async (gymId: string) => {
    setVerifyingGymId(gymId)
    try {
      const response = await fetch(`/api/gyms/${gymId}/verify`, { 
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        console.error('Verification failed:', data)
        alert(`Verification failed: ${data.error || data.message || `HTTP ${response.status}`}\n\nDetails: ${data.details || (data.userRole ? `Your role: ${data.userRole}` : 'Please check console for details')}`)
        return
      }
      
      if (data.success) {
        if (data.admin_override) {
          alert('Gym verified successfully! (Admin override - some requirements were missing)')
        } else {
          alert('Gym verified successfully!')
        }
        fetchData() // Refresh data
      } else {
        alert(`Verification failed: ${data.error || data.message || 'Unknown error'}`)
      }
    } catch (error: any) {
      console.error('Error verifying gym:', error)
      alert('Error verifying gym: ' + (error.message || 'Unknown error') + '\n\nPlease check the browser console for details.')
    } finally {
      setVerifyingGymId(null)
    }
  }

  const handleVerifyAllGyms = async () => {
    if (unverifiedGyms.length === 0) {
      alert('No unverified gyms to verify!')
      return
    }

    if (!confirm(`Are you sure you want to verify all ${unverifiedGyms.length} unverified gym(s)?\n\nThis will bypass all requirement checks and verify them immediately.`)) {
      return
    }

    setVerifyingAll(true)
    let successCount = 0
    let failCount = 0
    const errors: string[] = []

    try {
      // Verify all gyms sequentially
      for (const gym of unverifiedGyms) {
        try {
          const response = await fetch(`/api/gyms/${gym.id}/verify`, { 
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            }
          })
          
          const data = await response.json()
          
          if (response.ok && data.success) {
            successCount++
          } else {
            failCount++
            errors.push(`${gym.name}: ${data.error || data.message || 'Unknown error'}`)
          }
        } catch (error: any) {
          failCount++
          errors.push(`${gym.name}: ${error.message || 'Network error'}`)
        }
      }

      // Show results
      if (failCount === 0) {
        alert(`✅ Successfully verified all ${successCount} gym(s)!`)
      } else {
        alert(
          `Verification complete:\n\n✅ Success: ${successCount}\n❌ Failed: ${failCount}\n\n` +
          (errors.length > 0 ? `Errors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... and ${errors.length - 5} more` : ''}` : '')
        )
      }

      // Refresh data
      fetchData()
    } catch (error: any) {
      console.error('Error verifying all gyms:', error)
      alert('Error verifying gyms: ' + (error.message || 'Unknown error'))
    } finally {
      setVerifyingAll(false)
    }
  }

  // MVP ONLY: Create manual review - REMOVE BEFORE SHIPPING
  const handleCreateManualReview = async () => {
    if (!manualReviewForm.gym_id || !manualReviewForm.rating || !manualReviewForm.reviewer_name.trim()) {
      alert('Please fill in all required fields: gym, rating, and reviewer name')
      return
    }

    const supabase = createClient()
    
    // Generate random date between now and 1 year ago
    const now = new Date()
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    const randomTime = oneYearAgo.getTime() + Math.random() * (now.getTime() - oneYearAgo.getTime())
    const randomDate = new Date(randomTime)
    
    const { error } = await supabase
      .from('reviews')
      .insert({
        gym_id: manualReviewForm.gym_id,
        booking_id: null, // Manual reviews don't have bookings
        rating: parseInt(manualReviewForm.rating),
        comment: manualReviewForm.comment || null,
        reviewer_name: manualReviewForm.reviewer_name || null,
        manual_review: true, // Mark as manual review
        created_at: randomDate.toISOString(), // Random date between now and 1 year ago
      })

    if (error) {
      console.error('Error creating manual review:', error)
      alert('Failed to create review: ' + error.message)
      return
    }

    alert('Review created successfully!')
    setManualReviewForm({
      gym_id: '',
      rating: '5',
      comment: '',
      reviewer_name: ''
    })
    setShowManualReview(false)
  }

  const handleGymAction = async (gymId: string, action: 'approve' | 'reject') => {
    const supabase = createClient()
    
    const newStatus = action === 'approve' ? 'approved' : 'rejected'
    
    const { error } = await supabase
      .from('gyms')
      .update({ status: newStatus })
      .eq('id', gymId)

    if (error) {
      console.error('Error updating gym:', error)
      return
    }

    // If approving, fetch landmarks in background (one-time, cached forever)
    if (action === 'approve') {
      fetch(`/api/gyms/${gymId}/fetch-landmarks`, { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          if (data.landmarks) {
            console.log(`✅ Landmarks cached for gym ${gymId}`)
          }
        })
        .catch(err => {
          console.error('Error fetching landmarks:', err)
          // Non-critical, don't block approval
        })
    }

    fetchData()
  }

  // Show loading skeleton only if we're actually loading
  // Don't wait forever - if authLoading is stuck, proceed after timeout
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {[1, 2].map((i) => (
              <div key={i} className="border border-gray-300 rounded-lg p-6 bg-white">
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-300 rounded-lg p-6 bg-white">
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="space-y-2">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Show message if user is not admin
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-lg mb-4">Please sign in to access the admin panel.</p>
              <Button onClick={() => router.push('/auth/signin?redirect=/admin')}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Admin Access Required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                You need admin privileges to access this page. Your current role is: <strong>{profile?.role || 'none'}</strong>
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">To set yourself as admin:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>Go to your Supabase dashboard</li>
                  <li>Navigate to Table Editor → profiles</li>
                  <li>Find your user profile (ID: <code className="bg-gray-200 px-1 rounded">{user.id}</code>)</li>
                  <li>Update the <code className="bg-gray-200 px-1 rounded">role</code> column to <code className="bg-gray-200 px-1 rounded">admin</code></li>
                  <li>Refresh this page</li>
                </ol>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Or use SQL:</h3>
                <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`UPDATE profiles 
SET role = 'admin' 
WHERE id = '${user.id}';`}
                </pre>
              </div>

              <Button onClick={() => window.location.reload()} className="w-full">
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-6 h-6 text-[#003580]" />
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">Manage gyms, bookings, and platform operations</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link href="/admin/gyms">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  All Gyms
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Error Banner */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setError(null)
                  fetchData()
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.scrollTo({ top: document.getElementById('gym-verification')?.offsetTop || 0, behavior: 'smooth' })}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Unverified Gyms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{unverifiedGyms.length}</div>
              <p className="text-xs text-gray-500 mt-1">Draft status - need verification</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{pendingGyms.length}</div>
              <p className="text-xs text-gray-500 mt-1">Legacy status</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.scrollTo({ top: document.getElementById('recent-bookings')?.offsetTop || 0, behavior: 'smooth' })}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Recent Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{recentBookings.length}</div>
              <p className="text-xs text-gray-500 mt-1">Last 10 bookings</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Total Gyms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{allGyms.length}</div>
              <p className="text-xs text-gray-500 mt-1">Approved gyms</p>
            </CardContent>
          </Card>
        </div>

        {/* Gym Verification Section */}
        <div id="gym-verification" className="mb-8 scroll-mt-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#003580]" />
                Gym Verification
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Verify gyms to make them visible and bookable. All requirements must be met before verification.
              </p>
            </div>
            {unverifiedGyms.length > 0 && (
              <Button
                onClick={handleVerifyAllGyms}
                disabled={verifyingAll}
                className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
              >
                {verifyingAll ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Verify All ({unverifiedGyms.length})
                  </>
                )}
              </Button>
            )}
          </div>
          {unverifiedGyms.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No unverified gyms. All gyms are verified!
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {unverifiedGyms.map(gym => (
                <GymVerificationCard 
                  key={gym.id} 
                  gym={gym} 
                  onVerify={handleVerifyGym}
                  isVerifying={verifyingGymId === gym.id || verifyingAll}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pending Gyms */}
        {pendingGyms.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#003580]" />
              Pending Gym Approvals (Legacy)
            </h2>
            <div className="space-y-4">
              {pendingGyms.map(gym => (
                <Card key={gym.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{gym.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <p><strong>Location:</strong> {gym.city}, {gym.country}</p>
                      <p><strong>Disciplines:</strong> {gym.disciplines.join(', ')}</p>
                      <p><strong>Price:</strong> {gym.price_per_day} {gym.currency} / day</p>
                      {gym.description && (
                        <p><strong>Description:</strong> {gym.description.substring(0, 200)}...</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleGymAction(gym.id, 'approve')}
                        variant="default"
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleGymAction(gym.id, 'reject')}
                        variant="destructive"
                      >
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* MVP ONLY: Manual Review Creation - REMOVE BEFORE SHIPPING */}
        <div className="mb-8 border-t pt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Manual Reviews (MVP Only)</h2>
            <Button
              onClick={() => setShowManualReview(!showManualReview)}
              variant={showManualReview ? "outline" : "default"}
            >
              {showManualReview ? 'Hide' : 'Add Manual Review'}
            </Button>
          </div>
          
          {showManualReview && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="text-lg text-yellow-900">
                  ⚠️ MVP Only - Remove Before Shipping
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Gym *</Label>
                  <Select
                    value={manualReviewForm.gym_id}
                    onChange={(e) => setManualReviewForm({...manualReviewForm, gym_id: e.target.value})}
                  >
                    <option value="">Select a gym...</option>
                    {allGyms.map(gym => (
                      <option key={gym.id} value={gym.id}>
                        {gym.name} - {gym.city}, {gym.country}
                      </option>
                    ))}
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Reviewer Name *</Label>
                  <Input
                    value={manualReviewForm.reviewer_name}
                    onChange={(e) => setManualReviewForm({...manualReviewForm, reviewer_name: e.target.value})}
                    placeholder="e.g. John Smith, Sarah M., etc."
                    required
                  />
                  <p className="text-xs text-gray-500">This name will be displayed on the review</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Rating *</Label>
                  <Select
                    value={manualReviewForm.rating}
                    onChange={(e) => setManualReviewForm({...manualReviewForm, rating: e.target.value})}
                  >
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Very Good</option>
                    <option value="3">3 - Good</option>
                    <option value="2">2 - Fair</option>
                    <option value="1">1 - Poor</option>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Review Comment</Label>
                  <Textarea
                    value={manualReviewForm.comment}
                    onChange={(e) => setManualReviewForm({...manualReviewForm, comment: e.target.value})}
                    placeholder="Enter review comment..."
                    rows={4}
                  />
                </div>
                
                <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
                  <strong>Note:</strong> This review will appear with the reviewer name on the gym page. 
                  All manual reviews will remain after removing this feature.
                </div>
                
                <Button
                  onClick={handleCreateManualReview}
                  className="w-full"
                >
                  Create Verified Review
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Bookings */}
        <div id="recent-bookings" className="mb-8 scroll-mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#003580]" />
              Recent Bookings
            </h2>
            <Link href="/admin/bookings">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                View All
                <Eye className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          {recentBookings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No bookings yet
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {recentBookings.map(booking => (
                <Card 
                  key={booking.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedBookingId(booking.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {booking.booking_reference ? `Booking ${booking.booking_reference}` : `Booking #${booking.id.slice(0, 8)}`}
                      </CardTitle>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'pending_confirmation' ? 'bg-yellow-100 text-yellow-800' :
                        booking.status === 'pending_payment' ? 'bg-blue-100 text-blue-800' :
                        booking.status === 'declined' ? 'bg-red-100 text-red-800' :
                        booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Dates:</span>
                        <span>{new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}</span>
                      </div>
                      {booking.guest_name && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Guest:</span>
                          <span className="font-medium">{booking.guest_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Discipline:</span>
                        <span>{booking.discipline}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-semibold">{booking.total_price?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="pt-2 border-t text-xs text-gray-500">
                        Click to view full details
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Booking Details Modal */}
        <BookingDetailsModal
          bookingId={selectedBookingId}
          isOpen={!!selectedBookingId}
          onClose={() => setSelectedBookingId(null)}
          onRefresh={() => fetchData(true)}
        />
      </div>
    </div>
  )
}
