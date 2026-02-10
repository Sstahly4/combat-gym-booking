'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const DISCIPLINES = ['Muay Thai', 'MMA', 'BJJ', 'Boxing', 'Wrestling', 'Kickboxing']
const COUNTRIES = ['Thailand', 'Bali', 'Australia']
const CURRENCIES = ['USD', 'THB', 'AUD', 'IDR']

function GymOnboardingForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null)
  const [checkingVerification, setCheckingVerification] = useState(true)

  // Check email verification status on mount
  useEffect(() => {
    const checkVerification = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setEmailVerified(!!user.email_confirmed_at)
      } else {
        router.push('/auth/signin')
      }
      setCheckingVerification(false)
    }
    
    checkVerification()
  }, [router])
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    country: '',
    latitude: '',
    longitude: '',
    disciplines: [] as string[],
    price_per_day: '',
    price_per_week: '',
    currency: 'USD',
    google_maps_link: '',
    instagram_link: '',
    facebook_link: '',
    amenities: {
      accommodation: false,
      wifi: false,
      equipment: false,
      showers: false,
      parking: false,
      meals: false,
      locker_room: false,
      security: false,
      air_conditioning: false,
      swimming_pool: false,
      sauna: false,
      massage: false,
      laundry: false,
      airport_transfer: false,
      twenty_four_hour: false,
      personal_training: false,
      group_classes: false,
      pro_shop: false,
      nutritionist: false,
      physiotherapy: false,
      recovery_facilities: false,
      restaurant: false,
      cafe: false,
      english_speaking: false,
      beginner_friendly: false,
      competition_prep: false,
      ice_bath: false,
      steam_room: false,
      hot_tub: false,
      yoga_studio: false,
      crossfit_area: false,
      outdoor_training: false,
      weight_room: false,
      cardio_equipment: false,
      boxing_ring: false,
      mma_cage: false,
      wrestling_mats: false,
      climbing_wall: false,
      bike_storage: false,
      towel_service: false,
      water_station: false,
      changing_rooms: false,
      first_aid: false,
      fire_safety: false,
      wheelchair_accessible: false,
      wifi_lounge: false,
      co_working_space: false,
      printing_facilities: false,
      atm: false,
      vending_machines: false,
      bike_rental: false,
      scooter_rental: false,
      tour_booking: false,
      visa_assistance: false,
    },
  })

  const [images, setImages] = useState<File[]>([])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      amenities: { ...prev.amenities, [amenity]: checked }
    }))
  }

  const handleDisciplineToggle = (discipline: string) => {
    setFormData(prev => ({
      ...prev,
      disciplines: prev.disciplines.includes(discipline)
        ? prev.disciplines.filter(d => d !== discipline)
        : [...prev.disciplines, discipline]
    }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files)
      setImages(prev => [...prev, ...newImages].slice(0, 30)) // Max 30 images (reasonable limit)
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const uploadImages = async (gymId: string) => {
    const supabase = createClient()
    console.log('Starting image upload for gym:', gymId)
    
    const uploadPromises = images.map(async (image, index) => {
      try {
        const fileExt = image.name.split('.').pop()
        const fileName = `${gymId}/${Date.now()}-${index}.${fileExt}`
        
        console.log(`Uploading image ${index}: ${fileName}`)
        const { error: uploadError } = await supabase.storage
          .from('gym-images')
          .upload(fileName, image)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw uploadError
        }

        const { data } = supabase.storage
          .from('gym-images')
          .getPublicUrl(fileName)

        return {
          gym_id: gymId,
          url: data.publicUrl,
          order: index, // Set order based on upload sequence
        }
      } catch (e) {
        console.error('Failed to upload image:', e)
        return null
      }
    })

    const results = await Promise.all(uploadPromises)
    const validImages = results.filter(img => img !== null) as any[]
    
    console.log('Valid images to insert:', validImages)

    if (validImages.length > 0) {
      const { data, error } = await supabase
        .from('gym_images')
        .insert(validImages)
        .select()

      if (error) {
        console.error('Image DB insert error FULL OBJECT:', JSON.stringify(error, null, 2))
        throw error
      }
      
      console.log('Images inserted successfully:', data)
    }
  }

  const handleSubmit = async () => {
    console.log('Submitting form...')
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error('Auth error:', authError)
        router.push('/auth/signin')
        return
      }

      // Check email verification (important for production)
      if (!user.email_confirmed_at) {
        setError('Please verify your email address before creating a gym. Check your inbox for a confirmation email.')
        setLoading(false)
        return
      }

      // Verify user has owner role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'owner') {
        setError('You must have an owner account to create a gym. Please contact support.')
        setLoading(false)
        return
      }

      console.log('Creating gym for user:', user.id)

      // Create gym in draft status
      const { data: gym, error: gymError } = await supabase
        .from('gyms')
        .insert({
          owner_id: user.id,
          name: formData.name,
          description: formData.description,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
          disciplines: formData.disciplines,
          amenities: formData.amenities,
          price_per_day: parseFloat(formData.price_per_day),
          price_per_week: formData.price_per_week ? parseFloat(formData.price_per_week) : null,
          currency: formData.currency,
          status: 'pending',
          verification_status: 'draft',
          google_maps_link: formData.google_maps_link || null,
          instagram_link: formData.instagram_link || null,
          facebook_link: formData.facebook_link || null,
          stripe_connect_verified: false,
          admin_approved: false,
        })
        .select()
        .single()

      if (gymError) {
        console.error('Gym creation error:', gymError)
        throw new Error(`Failed to create gym: ${gymError.message}`)
      }

      console.log('Gym created successfully:', gym)

      // Upload images
      if (images.length > 0 && gym) {
        await uploadImages(gym.id)
      }

      setSuccess(true)
      // Small delay so user sees success message before redirect
      setTimeout(() => {
        router.push('/manage')
      }, 2000)
      
    } catch (err: any) {
      console.error('Submission failed:', err)
      setError(err.message || 'Failed to create gym')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-green-600">Gym Created Successfully!</CardTitle>
            <CardDescription>
              Your gym profile has been created in <strong>Draft</strong> mode. Complete verification to make it live and bookable.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800 font-medium mb-2">Next Steps to Go Live:</p>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Set up Stripe Connect (KYC + bank account)</li>
                <li>Wait for admin approval</li>
                <li>Your gym will be visible once verified</li>
              </ul>
            </div>
            <Button onClick={() => router.push('/manage')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (checkingVerification) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003580] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Create Your Gym Profile</CardTitle>
            <CardDescription>
              Step {step} of 3: {step === 1 ? 'Basic Information' : step === 2 ? 'Location & Pricing' : 'Images & Amenities'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Email Verification Notice */}
            {!emailVerified && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800 font-medium mb-1">Email Verification Required</p>
                <p className="text-sm text-yellow-700">
                  Please verify your email address before creating a gym. Check your inbox for a confirmation email from us.
                </p>
              </div>
            )}

            {searchParams?.get('verify_email') === 'true' && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800 font-medium mb-1">Check Your Email</p>
                <p className="text-sm text-blue-700">
                  We've sent a confirmation email. Please verify your email address to continue.
                </p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                Error: {error}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Gym Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={5}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Disciplines *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {DISCIPLINES.map(discipline => (
                      <label key={discipline} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.disciplines.includes(discipline)}
                          onChange={() => handleDisciplineToggle(discipline)}
                          className="rounded"
                        />
                        <span>{discipline}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button onClick={() => setStep(2)} disabled={!formData.name || !formData.description || formData.disciplines.length === 0}>
                  Next
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="address">Full Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="e.g., 123 Soi Bang Tao, Bangtao Beach, Phuket 83110, Thailand"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Include street number, street name, and postcode. You can copy this from Google Maps.
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Select
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      required
                    >
                      <option value="">Select country</option>
                      {COUNTRIES.map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude (optional)</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => handleInputChange('latitude', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude (optional)</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => handleInputChange('longitude', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price_per_day">Price per Day *</Label>
                    <Input
                      id="price_per_day"
                      type="number"
                      step="0.01"
                      value={formData.price_per_day}
                      onChange={(e) => handleInputChange('price_per_day', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price_per_week">Price per Week (optional)</Label>
                    <Input
                      id="price_per_week"
                      type="number"
                      step="0.01"
                      value={formData.price_per_week}
                      onChange={(e) => handleInputChange('price_per_week', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency *</Label>
                    <Select
                      id="currency"
                      value={formData.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      required
                    >
                      {CURRENCIES.map(currency => (
                        <option key={currency} value={currency}>{currency}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)} disabled={!formData.address || !formData.city || !formData.country || !formData.price_per_day || !formData.google_maps_link || !formData.instagram_link}>
                    Next
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Gym Images (up to 10)</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                  />
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-destructive text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Amenities</Label>
                    <p className="text-xs text-gray-500 mt-1 mb-3">
                      Select all amenities your gym offers (optional, can be updated later)
                    </p>
                  </div>
                  
                  {/* Basic Facilities */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Basic Facilities</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {['wifi', 'parking', 'showers', 'locker_room', 'air_conditioning', 'security'].map(key => (
                        <label 
                          key={key} 
                          className="flex items-center space-x-2 cursor-pointer p-2 rounded border border-gray-200 hover:border-[#003580] hover:bg-blue-50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={(formData.amenities as any)[key] || false}
                            onChange={(e) => handleAmenityChange(key, e.target.checked)}
                            className="rounded w-4 h-4 text-[#003580] focus:ring-[#003580]"
                          />
                          <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Accommodation & Services */}
                  <div className="space-y-2 pt-2">
                    <p className="text-sm font-medium text-gray-700">Accommodation & Services</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {['accommodation', 'meals', 'restaurant', 'cafe', 'laundry', 'airport_transfer'].map(key => (
                        <label 
                          key={key} 
                          className="flex items-center space-x-2 cursor-pointer p-2 rounded border border-gray-200 hover:border-[#003580] hover:bg-blue-50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={(formData.amenities as any)[key] || false}
                            onChange={(e) => handleAmenityChange(key, e.target.checked)}
                            className="rounded w-4 h-4 text-[#003580] focus:ring-[#003580]"
                          />
                          <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Training Facilities */}
                  <div className="space-y-2 pt-2">
                    <p className="text-sm font-medium text-gray-700">Training Facilities</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {['equipment', 'swimming_pool', 'sauna', 'recovery_facilities', 'pro_shop'].map(key => (
                        <label 
                          key={key} 
                          className="flex items-center space-x-2 cursor-pointer p-2 rounded border border-gray-200 hover:border-[#003580] hover:bg-blue-50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={(formData.amenities as any)[key] || false}
                            onChange={(e) => handleAmenityChange(key, e.target.checked)}
                            className="rounded w-4 h-4 text-[#003580] focus:ring-[#003580]"
                          />
                          <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Services & Support */}
                  <div className="space-y-2 pt-2">
                    <p className="text-sm font-medium text-gray-700">Services & Support</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {['personal_training', 'group_classes', 'massage', 'nutritionist', 'physiotherapy', 'competition_prep'].map(key => (
                        <label 
                          key={key} 
                          className="flex items-center space-x-2 cursor-pointer p-2 rounded border border-gray-200 hover:border-[#003580] hover:bg-blue-50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={(formData.amenities as any)[key] || false}
                            onChange={(e) => handleAmenityChange(key, e.target.checked)}
                            className="rounded w-4 h-4 text-[#003580] focus:ring-[#003580]"
                          />
                          <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Special Features */}
                  <div className="space-y-2 pt-2">
                    <p className="text-sm font-medium text-gray-700">Special Features</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {['twenty_four_hour', 'beginner_friendly', 'english_speaking'].map(key => (
                        <label 
                          key={key} 
                          className="flex items-center space-x-2 cursor-pointer p-2 rounded border border-gray-200 hover:border-[#003580] hover:bg-blue-50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={(formData.amenities as any)[key] || false}
                            onChange={(e) => handleAmenityChange(key, e.target.checked)}
                            className="rounded w-4 h-4 text-[#003580] focus:ring-[#003580]"
                          />
                          <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Creating...' : 'Create Gym'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function GymOnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003580] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <GymOnboardingForm />
    </Suspense>
  )
}
