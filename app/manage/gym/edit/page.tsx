'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Gym, GymImage } from '@/lib/types/database'
import { PackagesSection } from '@/components/manage/packages-section'
import { GymEditSidebar } from '@/components/manage/gym-edit-sidebar'
import { ArrowLeft, Info, ChevronDown, ChevronUp, Search, X, ChevronRight, Menu, X as XIcon } from 'lucide-react'
import Link from 'next/link'

const DISCIPLINES = ['Muay Thai', 'MMA', 'BJJ', 'Boxing', 'Wrestling', 'Kickboxing']
const CURRENCIES = ['USD', 'THB', 'AUD', 'IDR']
const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

// Complete list of all countries
const ALL_COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
  'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
  'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
  'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
  'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia',
  'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
  'Haiti', 'Honduras', 'Hungary',
  'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
  'Jamaica', 'Japan', 'Jordan',
  'Kazakhstan', 'Kenya', 'Kiribati', 'Korea, North', 'Korea, South', 'Kuwait', 'Kyrgyzstan',
  'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
  'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
  'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Macedonia', 'Norway',
  'Oman',
  'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
  'Qatar',
  'Romania', 'Russia', 'Rwanda',
  'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
  'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
  'Yemen',
  'Zambia', 'Zimbabwe'
].sort()

interface GymWithImages extends Gym {
  images: GymImage[]
  opening_hours?: any
  trainers?: any
  faq?: any
}

function EditGymForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const gymId = searchParams.get('id')
  
  const { user, profile, loading: authLoading } = useAuth()
  const [gym, setGym] = useState<GymWithImages | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState('basic')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [amenitiesExpanded, setAmenitiesExpanded] = useState(false)

  // Form State
  const [disciplines, setDisciplines] = useState<string[]>([])
  const [amenities, setAmenities] = useState<Record<string, boolean>>({
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
  })
  const [newImages, setNewImages] = useState<File[]>([])
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null)
  const [trainingScheduleExpanded, setTrainingScheduleExpanded] = useState(false)
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false,
  })
  const [countrySearch, setCountrySearch] = useState('')
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  
  // Additional optional fields
  const [openingHours, setOpeningHours] = useState<Record<string, string>>({
    monday: '07:00-20:00',
    tuesday: '07:00-20:00',
    wednesday: '07:00-20:00',
    thursday: '07:00-20:00',
    friday: '07:00-20:00',
    saturday: '08:00-18:00',
    sunday: 'closed',
  })
  const [trainingSchedule, setTrainingSchedule] = useState<Record<string, Array<{ time: string; type?: string }>>>({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  })
  const [trainers, setTrainers] = useState<Array<{ name: string; discipline: string; experience: string }>>([])
  const [faq, setFaq] = useState<Array<{ question: string; answer: string }>>([])

  // Get cache key for this gym
  const getCacheKey = () => gymId ? `gym_edit_${gymId}` : null

  // Save form state to localStorage
  const saveFormState = () => {
    const cacheKey = getCacheKey()
    if (!cacheKey) return

    try {
      const formState = {
        disciplines,
        amenities,
        selectedCountry,
        openingHours,
        trainingSchedule,
        trainers,
        faq,
        // Note: newImages (File objects) can't be serialized, so we skip them
        timestamp: Date.now(),
      }
      localStorage.setItem(cacheKey, JSON.stringify(formState))
    } catch (error) {
      console.error('Failed to save form state to localStorage:', error)
    }
  }

  // Restore form state from localStorage
  const restoreFormState = () => {
    const cacheKey = getCacheKey()
    if (!cacheKey) return false

    try {
      const cached = localStorage.getItem(cacheKey)
      if (!cached) return false

      const formState = JSON.parse(cached)
      
      // Only restore if cache is less than 24 hours old
      const cacheAge = Date.now() - (formState.timestamp || 0)
      if (cacheAge > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(cacheKey)
        return false
      }

      // Restore form state
      if (formState.disciplines) setDisciplines(formState.disciplines)
      if (formState.amenities) setAmenities(formState.amenities)
      if (formState.selectedCountry) setSelectedCountry(formState.selectedCountry)
      if (formState.openingHours) setOpeningHours(formState.openingHours)
      if (formState.trainingSchedule) setTrainingSchedule(formState.trainingSchedule)
      if (formState.trainers) setTrainers(formState.trainers)
      if (formState.faq) setFaq(formState.faq)

      return true
    } catch (error) {
      console.error('Failed to restore form state from localStorage:', error)
      return false
    }
  }

  // Clear cached form state
  const clearFormState = () => {
    const cacheKey = getCacheKey()
    if (cacheKey) {
      localStorage.removeItem(cacheKey)
    }
  }

  // Auto-save form state whenever it changes
  useEffect(() => {
    if (!gymId || loading) return
    saveFormState()
  }, [disciplines, amenities, selectedCountry, openingHours, trainingSchedule, trainers, faq, gymId, loading])

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    if (!gymId || loading) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only warn if there are actual changes (we have cached state)
      const cacheKey = getCacheKey()
      if (cacheKey && localStorage.getItem(cacheKey)) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [gymId, loading])

  useEffect(() => {
    if (authLoading) return
    
    if (!user || (profile?.role !== 'owner' && profile?.role !== 'admin')) {
      setErrorMsg('Unauthorized: You must be a gym owner or admin.')
      return
    }
    
    if (gymId) {
      fetchGym(gymId)
    } else {
      setErrorMsg('No gym ID provided.')
      setLoading(false)
    }
  }, [user, profile, gymId, authLoading])

  const fetchGym = async (id: string) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('gyms')
      .select(`
        *,
        images:gym_images(*)
      `)
      .eq('id', id)
      .single()
    
    // Sort images by order
    if (data?.images) {
      data.images.sort((a: GymImage, b: GymImage) => (a.order || 0) - (b.order || 0))
    }

    if (error) {
      setErrorMsg(`Error fetching gym: ${error.message}`)
      setLoading(false)
      return
    }

    // Allow admins to edit any gym, owners can only edit their own
    if (profile?.role !== 'admin' && data.owner_id !== user?.id) {
      setErrorMsg('You do not own this gym.')
      setLoading(false)
      return
    }

    // Create a deep mutable copy to avoid readonly property errors
    // Use structuredClone if available, otherwise JSON parse/stringify
    const createMutableCopy = (obj: any): any => {
      if (typeof structuredClone !== 'undefined') {
        return structuredClone(obj)
      }
      return JSON.parse(JSON.stringify(obj))
    }
    
    const mutableGym = createMutableCopy(data)
    if (mutableGym.images) {
      mutableGym.images = [...mutableGym.images]
    }
    setGym(mutableGym as any)
    
    // Try to restore cached form state first
    const hasCachedState = restoreFormState()
    
    // If no cached state, use data from database
    if (!hasCachedState) {
      setSelectedCountry(data.country || '')
      setDisciplines(data.disciplines || [])
    }
    
    // Initialize all amenities with defaults, then merge saved data
    const defaultAmenities: Record<string, boolean> = {
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
    }
    if (!hasCachedState) {
      setAmenities({
        ...defaultAmenities,
        ...(data.amenities || {}),
      })
    } else {
      // If we restored from cache, merge in any NEW amenities from database (don't overwrite cached values)
      // Only add amenities that exist in database but not in cache
      setAmenities(prev => {
        const merged = { ...defaultAmenities, ...prev }
        // Only add new amenities from database that don't exist in cache
        if (data.amenities) {
          Object.keys(data.amenities).forEach(key => {
            if (!(key in prev)) {
              merged[key] = data.amenities[key]
            }
          })
        }
        return merged
      })
    }
    
    // Load optional fields (only if not cached)
    if (!hasCachedState) {
      if (data.opening_hours) {
        setOpeningHours(data.opening_hours)
      }
      if (data.training_schedule) {
        // Handle both old string format and new array format
        const schedule = data.training_schedule
        if (typeof schedule === 'object' && !Array.isArray(schedule)) {
          const converted: Record<string, Array<{ time: string; type?: string }>> = {}
          DAYS_OF_WEEK.forEach(day => {
            if (schedule[day]) {
              if (typeof schedule[day] === 'string') {
                // Old format: convert string to array
                converted[day] = [{ time: schedule[day] }]
              } else if (Array.isArray(schedule[day])) {
                // New format: already array - create a new mutable array copy to avoid readonly issues
                converted[day] = Array.from(schedule[day]).map(session => ({ 
                  time: session.time || '', 
                  type: session.type || '' 
                }))
              } else {
                converted[day] = []
              }
            } else {
              converted[day] = []
            }
          })
          setTrainingSchedule(converted)
        } else {
          // Initialize empty if not present
          const empty: Record<string, Array<{ time: string; type?: string }>> = {}
          DAYS_OF_WEEK.forEach(day => {
            empty[day] = []
          })
          setTrainingSchedule(empty)
        }
      }
      if (data.trainers && Array.isArray(data.trainers)) {
        setTrainers(data.trainers)
      }
      if (data.faq && Array.isArray(data.faq)) {
        setFaq(data.faq)
      }
    }
    
    setLoading(false)
  }

  const handleDisciplineToggle = (discipline: string) => {
    setDisciplines(prev => 
      prev.includes(discipline)
        ? prev.filter(d => d !== discipline)
        : [...prev, discipline]
    )
  }

  const handleAmenityChange = (key: string, checked: boolean) => {
    setAmenities(prev => {
      const updated = { ...prev, [key]: checked }
      console.log('Amenity changed:', key, checked, 'Total selected:', Object.values(updated).filter(v => v === true).length)
      return updated
    })
  }
  
  // Stable alphabetical sort - don't reorder when items are checked/unchecked
  const sortedAmenities = Object.entries(amenities).sort(([a], [b]) => {
    return a.localeCompare(b)
  })

  const handleNewImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      const currentCount = (gym?.images?.length || 0) + newImages.length
      const remainingSlots = 30 - currentCount
      if (remainingSlots > 0) {
        setNewImages(prev => [...prev, ...files.slice(0, remainingSlots)])
      } else {
        alert('Maximum 30 images allowed')
      }
    }
  }

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index))
  }

  const deleteExistingImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('gym_images')
      .delete()
      .eq('id', imageId)

    if (error) {
      alert('Failed to delete image')
    } else {
      fetchGym(gym!.id)
    }
  }

  const uploadNewImages = async (gymId: string) => {
    const supabase = createClient()
    
    const existingImages = gym?.images || []
    const maxOrder = existingImages.length > 0 
      ? Math.max(...existingImages.map((img: GymImage) => img.order || 0))
      : -1
    
    console.log(`Starting upload of ${newImages.length} images for gym ${gymId}`)
    
    // First, upload all images to storage
    const uploadPromises = newImages.map(async (image, index) => {
      try {
        const fileExt = image.name.split('.').pop() || 'jpg'
        const timestamp = Date.now()
        const fileName = `${gymId}/${timestamp}-${index}.${fileExt}`
        
        console.log(`Uploading image ${index + 1}/${newImages.length} to storage: ${fileName}`)
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('gym-images')
          .upload(fileName, image, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error(`Storage upload error for image ${index}:`, uploadError)
          throw new Error(`Storage upload failed: ${uploadError.message}`)
        }

        console.log(`Storage upload successful: ${fileName}`)

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('gym-images')
          .getPublicUrl(fileName)

        if (!urlData?.publicUrl) {
          throw new Error('Failed to get public URL for uploaded image')
        }

        return {
          gym_id: gymId,
          url: urlData.publicUrl,
          order: maxOrder + index + 1,
        }
      } catch (e: any) {
        console.error(`Failed to upload image ${index}:`, e)
        const errorMessage = e?.message || e?.toString() || 'Unknown error'
        throw new Error(`Image ${index + 1} (${image.name}): ${errorMessage}`)
      }
    })

    const uploadResults = await Promise.allSettled(uploadPromises)
    const validImageData: Array<{ gym_id: string; url: string; order: number }> = []
    const errors: string[] = []
    const uploadedFiles: string[] = [] // Track files to clean up on error
    
    uploadResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        validImageData.push(result.value)
        // Extract filename from URL for cleanup tracking
        const urlParts = result.value.url.split('/')
        uploadedFiles.push(urlParts[urlParts.length - 1])
      } else {
        const errorMsg = result.status === 'rejected' 
          ? result.reason?.message || result.reason?.toString() || 'Unknown error'
          : 'Unknown error'
        errors.push(`Image ${index + 1}: ${errorMsg}`)
        console.error(`Failed to upload image ${index}:`, result)
      }
    })

    // If any uploads failed, don't proceed with database insert
    if (validImageData.length === 0) {
      throw new Error(`All image uploads failed. ${errors.join('; ')}`)
    }

    // If some uploads failed, clean up successful ones and throw error
    if (validImageData.length !== newImages.length) {
      // Clean up successfully uploaded files
      const filePaths = uploadedFiles.map(file => `${gymId}/${file}`)
      await supabase.storage.from('gym-images').remove(filePaths)
      const errorDetails = errors.length > 0 ? ` Errors: ${errors.join('; ')}` : ''
      throw new Error(`Only ${validImageData.length} of ${newImages.length} images were uploaded successfully.${errorDetails}`)
    }

    // Insert all images into database at once (like onboarding does)
    console.log(`Inserting ${validImageData.length} image records into database`)
    const { data: insertedImages, error: insertError } = await supabase
      .from('gym_images')
      .insert(validImageData)
      .select()

    if (insertError) {
      console.error('Database insert error:', insertError)
      // Clean up uploaded files
      const filePaths = uploadedFiles.map(file => `${gymId}/${file}`)
      await supabase.storage.from('gym-images').remove(filePaths)
      throw new Error(`Failed to save image records: ${insertError.message}`)
    }

    console.log(`Successfully uploaded and saved ${insertedImages?.length || 0} images`)

    // Update gym state with new images
    if (insertedImages && insertedImages.length > 0 && gym) {
      const updatedImages = [...(gym.images || []), ...insertedImages].sort((a, b) => (a.order || 0) - (b.order || 0))
      // Create a new mutable object to avoid readonly property errors
      const createMutableCopy = (obj: any): any => {
        if (typeof structuredClone !== 'undefined') {
          return structuredClone(obj)
        }
        return JSON.parse(JSON.stringify(obj))
      }
      setGym({
        ...createMutableCopy(gym),
        images: updatedImages
      })
      // Clear new images after successful upload
      setNewImages([])
    }

    return insertedImages || []
  }

  const handleDragStart = (index: number) => {
    setDraggedImageIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedImageIndex === null || !gym) return

    const images = [...gym.images]
    const draggedImage = images[draggedImageIndex]
    
    images.splice(draggedImageIndex, 1)
    images.splice(dropIndex, 0, draggedImage)
    
    const updatedImages = images.map((img, index) => ({
      ...img,
      order: index
    }))

    // Update state immediately for UI feedback
    // Create a new mutable object to avoid readonly property errors
    const createMutableCopy = (obj: any): any => {
      if (typeof structuredClone !== 'undefined') {
        return structuredClone(obj)
      }
      return JSON.parse(JSON.stringify(obj))
    }
    setGym({
      ...createMutableCopy(gym),
      images: updatedImages
    })

    // Save to database
    const supabase = createClient()
    const updatePromises = updatedImages.map((img) =>
      supabase
        .from('gym_images')
        .update({ order: img.order })
        .eq('id', img.id)
    )

    const results = await Promise.allSettled(updatePromises)
    const failed = results.filter(r => r.status === 'rejected')
    
    if (failed.length > 0) {
      console.error('Failed to update image order:', failed)
      alert('Some image order updates failed. Please try again.')
      // Reload gym data to restore correct order
      if (gymId) {
        await fetchGym(gymId)
      }
    }
    
    setDraggedImageIndex(null)
  }

  const addTrainer = () => {
    setTrainers([...trainers, { name: '', discipline: '', experience: '' }])
  }

  const removeTrainer = (index: number) => {
    setTrainers(trainers.filter((_, i) => i !== index))
  }

  const updateTrainer = (index: number, field: string, value: string) => {
    const updated = [...trainers]
    updated[index] = { ...updated[index], [field]: value }
    setTrainers(updated)
  }

  const addFaq = () => {
    setFaq([...faq, { question: '', answer: '' }])
  }

  const removeFaq = (index: number) => {
    setFaq(faq.filter((_, i) => i !== index))
  }

  const updateFaq = (index: number, field: string, value: string) => {
    const updated = [...faq]
    updated[index] = { ...updated[index], [field]: value }
    setFaq(updated)
  }

  const handleSave = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault()
    if (!gym) return

    setSaving(true)
    setErrorMsg(null) // Clear any previous errors
    const supabase = createClient()
    
    // Get form element - handle both direct form submission and programmatic submission
    const formElement = e?.currentTarget || document.getElementById('edit-gym-form') as HTMLFormElement
    if (!formElement) {
      setErrorMsg('Form not found')
      setSaving(false)
      return
    }
    
    const formData = new FormData(formElement)
    const updates = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      country: selectedCountry,
      latitude: formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : null,
      longitude: formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : null,
      price_per_day: parseFloat(formData.get('price_per_day') as string),
      price_per_week: formData.get('price_per_week') ? parseFloat(formData.get('price_per_week') as string) : null,
      currency: formData.get('currency') as string,
      disciplines: [...disciplines], // Create new array to avoid readonly issues
      amenities: { ...amenities }, // Create new object to avoid readonly issues
      google_maps_link: formData.get('google_maps_link') as string || null,
      instagram_link: formData.get('instagram_link') as string || null,
      facebook_link: formData.get('facebook_link') as string || null,
      opening_hours: { ...openingHours }, // Create new object to avoid readonly issues
      training_schedule: Object.fromEntries(
        Object.entries(trainingSchedule).map(([day, sessions]) => [
          day,
          [...sessions].filter(s => s.time.trim() !== '') // Create new array and filter
        ])
      ),
      trainers: [...trainers].filter(t => t.name && t.discipline), // Create new array
      faq: [...faq].filter(f => f.question && f.answer), // Create new array
    }

    try {
      // Log what we're saving for debugging
      const selectedAmenitiesCount = Object.values(amenities).filter(v => v === true).length
      console.log('Saving amenities:', {
        total: Object.keys(amenities).length,
        selected: selectedAmenitiesCount,
        amenities: Object.entries(amenities).filter(([_, v]) => v === true).map(([k]) => k)
      })
      
      const { error, data } = await supabase
        .from('gyms')
        .update(updates)
        .eq('id', gym.id)
        .select()

      if (error) {
        console.error('Error updating gym:', error)
        throw error
      }
      
      console.log('Gym updated successfully. Saved amenities:', data?.[0]?.amenities)

      // Upload new images before redirecting
      if (newImages.length > 0) {
        try {
          await uploadNewImages(gym.id)
        } catch (uploadError: any) {
          console.error('Image upload error:', uploadError)
          throw new Error(`Failed to upload images: ${uploadError.message}`)
        }
      }

      // Save current image order (in case images were reordered)
      if (gym.images && gym.images.length > 0) {
        const supabase = createClient()
        // Create a mutable copy of images array to avoid readonly errors
        const imagesCopy = [...gym.images]
        const orderUpdates = imagesCopy.map((img, index) => ({
          id: img.id,
          order: index
        }))

        const updatePromises = orderUpdates.map(({ id, order }) =>
          supabase
            .from('gym_images')
            .update({ order })
            .eq('id', id)
        )

        const results = await Promise.allSettled(updatePromises)
        const failed = results.filter(r => r.status === 'rejected')
        
        if (failed.length > 0) {
          console.error('Failed to update some image orders:', failed)
          // Don't throw - allow save to complete, just log the error
        }
      }

      // Clear cached form state on successful save
      clearFormState()

      router.push('/manage')
    } catch (err: any) {
      console.error('Error updating gym:', err)
      setErrorMsg(`Update failed: ${err.message}`)
    }
    setSaving(false)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="border border-gray-300 rounded-lg p-8 bg-white space-y-6">
            <div className="space-y-4">
              <div className="h-11 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-32 w-full bg-gray-200 rounded animate-pulse" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-11 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-11 w-full bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
              <p className="text-gray-700 mb-4">{errorMsg}</p>
              <Button onClick={() => router.push('/manage')}>Back to Dashboard</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!gym) return null

  // Calculate section completion status
  const sectionStatus = {
    basic: { completed: !!(gym.name && gym.description && gym.price_per_day), required: true },
    location: { completed: !!(gym.address && gym.city && selectedCountry), required: true },
    images: { completed: !!(gym.images && gym.images.length > 0), required: true },
    disciplines: { completed: disciplines.length > 0, required: true },
    schedule: { completed: false, required: false },
    trainers: { completed: trainers.length > 0, required: false },
    faq: { completed: faq.length > 0, required: false },
    packages: { completed: false, required: true },
  }

  // Scroll to section
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId)
    const element = document.getElementById(`section-${sectionId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    setSidebarOpen(false) // Close mobile sidebar
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <Link 
            href="/manage" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Edit Gym</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2"
          >
            {sidebarOpen ? <XIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Navigation - Fixed below navbar */}
        <aside className={`
          fixed top-16 md:top-16 left-0 h-[calc(100vh-4rem)] z-40 bg-white border-r border-gray-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          transition-transform duration-300 ease-in-out
        `}>
          <GymEditSidebar
            activeSection={activeSection}
            onSectionChange={scrollToSection}
            sections={sectionStatus}
          />
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content - Add left margin on desktop to account for fixed sidebar */}
        <main className="flex-1 min-w-0 md:ml-64">
          <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
            {/* Desktop Header */}
            <div className="hidden md:block mb-8">
              <Link 
                href="/manage" 
                className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Gym Profile</h1>
              <p className="text-gray-600">Update your gym information to attract more bookings</p>
            </div>

            <form id="edit-gym-form" onSubmit={handleSave} className="space-y-6">
          {/* Basic Information */}
          <Card id="section-basic" className="scroll-mt-6">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Tell us about your gym</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Gym Name <span className="text-red-500">*</span></Label>
                <Input 
                  id="name" 
                  name="name" 
                  defaultValue={gym.name} 
                  required 
                  className="max-w-2xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  defaultValue={gym.description || ''} 
                  required 
                  rows={6}
                  className="max-w-4xl"
                  placeholder="Describe your gym, training philosophy, facilities, and what makes it special..."
                />
                <p className="text-xs text-gray-500">
                  A detailed description helps potential customers understand what makes your gym unique
                </p>
              </div>

              {/* Base Pricing - Moved here from separate section */}
              <div className="pt-6 border-t space-y-4">
                <div>
                  <Label className="text-base font-semibold">Base Pricing</Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Base prices used for "Starting from" display. Detailed pricing is managed in Packages below.
                  </p>
                </div>
                <div className="grid md:grid-cols-3 gap-4 max-w-3xl">
                  <div className="space-y-2">
                    <Label htmlFor="price_per_day">Base Price per Day <span className="text-red-500">*</span></Label>
                    <Input 
                      id="price_per_day" 
                      name="price_per_day" 
                      type="number" 
                      step="0.01" 
                      defaultValue={gym.price_per_day} 
                      required 
                    />
                    <p className="text-xs text-gray-500">Used for "Starting from" display</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price_per_week">Base Price per Week (optional)</Label>
                    <Input 
                      id="price_per_week" 
                      name="price_per_week" 
                      type="number" 
                      step="0.01" 
                      defaultValue={gym.price_per_week || ''} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency <span className="text-red-500">*</span></Label>
                    <Select name="currency" defaultValue={gym.currency} required>
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location & Verification */}
          <Card id="section-location" className="scroll-mt-6">
            <CardHeader>
              <CardTitle>Location & Verification</CardTitle>
              <CardDescription>Help customers find and verify your gym</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Full Address <span className="text-red-500">*</span></Label>
                <Input 
                  id="address" 
                  name="address" 
                  defaultValue={gym.address || ''} 
                  placeholder="e.g., 123 Soi Bang Tao, Bangtao Beach, Phuket 83110, Thailand"
                  required 
                />
                <p className="text-xs text-gray-500">
                  Include street number, street name, and postcode. You can copy this from Google Maps.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
                <div className="space-y-2">
                  <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
                  <Input id="city" name="city" defaultValue={gym.city} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="country"
                        type="text"
                        value={countryDropdownOpen ? countrySearch : selectedCountry}
                        onChange={(e) => {
                          setCountrySearch(e.target.value)
                          setCountryDropdownOpen(true)
                        }}
                        onFocus={() => {
                          setCountryDropdownOpen(true)
                          if (selectedCountry) {
                            setCountrySearch(selectedCountry)
                          }
                        }}
                        placeholder={selectedCountry ? "" : "Search for a country..."}
                        className="pl-10 pr-10"
                        required
                      />
                      {selectedCountry && !countryDropdownOpen && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCountry('')
                            setCountrySearch('')
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      {countryDropdownOpen && countrySearch && (
                        <button
                          type="button"
                          onClick={() => {
                            setCountrySearch('')
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    {countryDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setCountryDropdownOpen(false)}
                        />
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-hidden">
                          <div className="overflow-y-auto max-h-60">
                            {ALL_COUNTRIES
                              .filter(country => 
                                country.toLowerCase().includes(countrySearch.toLowerCase())
                              )
                              .map(country => (
                                <button
                                  key={country}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCountry(country)
                                    setCountrySearch('')
                                    setCountryDropdownOpen(false)
                                  }}
                                  className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors ${
                                    selectedCountry === country ? 'bg-blue-50 text-[#003580] font-medium' : 'text-gray-700'
                                  }`}
                                >
                                  {country}
                                </button>
                              ))}
                            {ALL_COUNTRIES.filter(country => 
                              country.toLowerCase().includes(countrySearch.toLowerCase())
                            ).length === 0 && (
                              <div className="px-4 py-2 text-sm text-gray-500">
                                No countries found
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <input type="hidden" name="country" value={selectedCountry} required />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude (optional)</Label>
                  <Input 
                    id="latitude" 
                    name="latitude" 
                    type="number" 
                    step="any" 
                    defaultValue={gym.latitude || ''} 
                    placeholder="e.g., 7.8804"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude (optional)</Label>
                  <Input 
                    id="longitude" 
                    name="longitude" 
                    type="number" 
                    step="any" 
                    defaultValue={gym.longitude || ''} 
                    placeholder="e.g., 98.3923"
                  />
                </div>
              </div>

              <div className="pt-4 border-t space-y-4">
                {profile?.role !== 'admin' && (
                  <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Verification Links Required</p>
                      <p className="text-blue-700">These links are required for gym verification. Make sure they match your gym's address and are publicly accessible.</p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="google_maps_link">
                    Google Maps Listing Link {profile?.role !== 'admin' && <span className="text-red-500">*</span>}
                  </Label>
                  <Input 
                    id="google_maps_link" 
                    name="google_maps_link" 
                    type="url"
                    defaultValue={(gym as any).google_maps_link || ''} 
                    placeholder="https://maps.google.com/..."
                    required={profile?.role !== 'admin'} 
                  />
                  <p className="text-xs text-gray-500">
                    Link to your gym's Google Maps listing. This must match your address above.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
                  <div className="space-y-2">
                    <Label htmlFor="instagram_link">
                      Instagram Link {profile?.role !== 'admin' && <span className="text-red-500">*</span>}
                    </Label>
                    <Input 
                      id="instagram_link" 
                      name="instagram_link" 
                      type="url"
                      defaultValue={(gym as any).instagram_link || ''} 
                      placeholder="https://instagram.com/yourgym"
                      required={profile?.role !== 'admin'} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebook_link">Facebook Link (optional)</Label>
                    <Input 
                      id="facebook_link" 
                      name="facebook_link" 
                      type="url"
                      defaultValue={(gym as any).facebook_link || ''} 
                      placeholder="https://facebook.com/yourgym"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disciplines & Amenities */}
          <Card id="section-disciplines" className="scroll-mt-6">
            <CardHeader>
              <CardTitle>Disciplines & Amenities</CardTitle>
              <CardDescription>What do you offer?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Disciplines Offered <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {DISCIPLINES.map(d => (
                    <label 
                      key={d} 
                      className="flex items-center space-x-2 cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-[#003580] hover:bg-blue-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={disciplines.includes(d)}
                        onChange={() => handleDisciplineToggle(d)}
                        className="rounded w-4 h-4 text-[#003580] focus:ring-[#003580]"
                      />
                      <span className="text-sm font-medium">{d}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Amenities</Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Select all that apply. More amenities help customers find what they're looking for.
                    </p>
                  </div>
                  {sortedAmenities.length > 12 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setAmenitiesExpanded(!amenitiesExpanded)}
                      className="text-xs text-[#003580] hover:text-[#003580]/80"
                    >
                      {amenitiesExpanded ? (
                        <>
                          <ChevronUp className="w-3 h-3 mr-1 inline" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3 mr-1 inline" />
                          Show More ({sortedAmenities.length - 12} more)
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
                  {sortedAmenities.slice(0, amenitiesExpanded ? sortedAmenities.length : 12).map(([key, value]) => (
                    <label 
                      key={key} 
                      className={`flex items-start gap-2.5 cursor-pointer p-2.5 rounded-md border transition-colors ${
                        value 
                          ? 'border-[#003580] bg-blue-50 shadow-sm' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => handleAmenityChange(key, e.target.checked)}
                        className="rounded w-4 h-4 text-[#003580] focus:ring-2 focus:ring-[#003580] focus:ring-offset-1 cursor-pointer flex-shrink-0 mt-0.5"
                      />
                      <span className="text-sm text-gray-700 capitalize leading-tight select-none flex-1">
                        {key.replace(/_/g, ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card id="section-images" className="scroll-mt-6">
            <CardHeader>
              <CardTitle>Images</CardTitle>
              <CardDescription>Upload up to 30 images. Drag to reorder - the first image is your main photo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 font-medium">
                    Images ({(gym.images?.length || 0) + newImages.length}/30)
                  </p>
                  <div className="space-y-2 max-w-md">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      onChange={handleNewImageSelect}
                      disabled={(gym.images?.length || 0) + newImages.length >= 30}
                      className="text-sm"
                    />
                  </div>
                </div>
                
                {(gym.images && gym.images.length > 0) || newImages.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Existing images */}
                    {gym.images && gym.images.map((img, index) => (
                      <div
                        key={img.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        className={`relative aspect-video cursor-move group rounded-lg overflow-hidden border-2 ${
                          draggedImageIndex === index 
                            ? 'opacity-50 border-[#003580]' 
                            : 'border-gray-200 hover:border-[#003580]'
                        } transition-all`}
                      >
                        <img 
                          src={img.url} 
                          alt="Gym" 
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-medium">
                          #{index + 1}
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteExistingImage(img.id)}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold transition-colors shadow-lg"
                        >
                          ×
                        </button>
                        {index === 0 && (
                          <div className="absolute bottom-2 left-2 bg-[#003580] text-white text-xs px-2 py-1 rounded font-medium">
                            Main Photo
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* New images (preview before upload) */}
                    {newImages.map((img, i) => {
                      const displayIndex = (gym.images?.length || 0) + i
                      return (
                        <div
                          key={`new-${i}`}
                          draggable={false}
                          className="relative aspect-video rounded-lg overflow-hidden border-2 border-blue-300 border-dashed"
                        >
                          <img 
                            src={URL.createObjectURL(img)} 
                            alt="Preview" 
                            className="w-full h-full object-cover" 
                          />
                          <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded font-medium">
                            #{displayIndex + 1} (New)
                          </div>
                          <button
                            type="button"
                            onClick={() => removeNewImage(i)}
                            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold transition-colors shadow-lg"
                          >
                            ×
                          </button>
                          <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded font-medium">
                            Will be uploaded on save
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No images uploaded yet. Upload images above to get started.</p>
                  </div>
                )}
                
                <p className="text-xs text-gray-500">
                  Drag existing images to reorder. New images will be added at the end when you save.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Details - Optional but helpful */}
          <Card id="section-schedule" className="scroll-mt-6">
            <CardHeader>
              <CardTitle>Additional Details (Optional)</CardTitle>
              <CardDescription>More information helps customers make better decisions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Opening Hours */}
              <div className="space-y-3">
                <div>
                  <Label>Gym Opening Hours (optional)</Label>
                  <p className="text-xs text-gray-500 mt-1">
                    When is your gym facility open to the public?
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-3 max-w-2xl">
                  {DAYS_OF_WEEK.map(day => (
                    <div key={day} className="flex items-center gap-3">
                      <Label htmlFor={`hours-${day}`} className="w-24 capitalize text-sm font-medium text-gray-700">
                        {day}:
                      </Label>
                      <Input
                        id={`hours-${day}`}
                        value={openingHours[day] || ''}
                        onChange={(e) => setOpeningHours({ ...openingHours, [day]: e.target.value })}
                        placeholder="e.g., 07:00-20:00 or closed"
                        className="w-48"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Training Schedule */}
              <div className="pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setTrainingScheduleExpanded(!trainingScheduleExpanded)}
                  className="w-full flex items-center justify-between p-2 -m-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="text-left">
                    <Label className="text-base font-medium cursor-pointer">Training Schedule (optional)</Label>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Add training sessions for each day. You can add multiple sessions per day.
                    </p>
                  </div>
                  {trainingScheduleExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0 ml-4" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0 ml-4" />
                  )}
                </button>
                
                {trainingScheduleExpanded && (
                  <div className="mt-4 space-y-3 max-w-3xl">
                    {DAYS_OF_WEEK.map(day => {
                      const sessions = trainingSchedule[day] || []
                      const isDayExpanded = expandedDays[day]
                      const sessionCount = sessions.filter(s => s.time.trim() !== '').length
                      
                      return (
                        <div key={day} className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setExpandedDays({ ...expandedDays, [day]: !isDayExpanded })}
                            className="w-full flex items-center justify-between p-4 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {isDayExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              )}
                              <Label className="capitalize text-sm font-semibold text-gray-900 cursor-pointer">
                                {day.charAt(0).toUpperCase() + day.slice(1)}
                              </Label>
                              {sessionCount > 0 && (
                                <span className="text-xs text-gray-500">
                                  ({sessionCount} {sessionCount === 1 ? 'session' : 'sessions'})
                                </span>
                              )}
                            </div>
                            {!isDayExpanded && sessionCount === 0 && (
                              <span className="text-xs text-gray-400 italic">No sessions</span>
                            )}
                          </button>
                          
                          {isDayExpanded && (
                            <div className="p-4 pt-0 space-y-3">
                              <div className="flex justify-end">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setTrainingSchedule({
                                      ...trainingSchedule,
                                      [day]: [...sessions, { time: '', type: '' }]
                                    })
                                  }}
                                  className="text-xs"
                                >
                                  + Add Session
                                </Button>
                              </div>
                              
                              {sessions.length === 0 ? (
                                <p className="text-xs text-gray-500 italic text-center py-2">No training sessions scheduled</p>
                              ) : (
                                <div className="space-y-2">
                                  {sessions.map((session, sessionIndex) => (
                                    <div key={sessionIndex} className="flex gap-2 items-start bg-white p-3 rounded border border-gray-200">
                                      <div className="flex-1 grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                          <Label className="text-xs text-gray-600">Time <span className="text-red-500">*</span></Label>
                                          <Input
                                            value={session.time}
                                            onChange={(e) => {
                                              const updated = [...sessions]
                                              updated[sessionIndex] = { ...session, time: e.target.value }
                                              setTrainingSchedule({ ...trainingSchedule, [day]: updated })
                                            }}
                                            placeholder="e.g., 6:00-8:00"
                                            className="text-sm"
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-xs text-gray-600">Type (optional)</Label>
                                          <Input
                                            value={session.type || ''}
                                            onChange={(e) => {
                                              const updated = [...sessions]
                                              updated[sessionIndex] = { ...session, type: e.target.value }
                                              setTrainingSchedule({ ...trainingSchedule, [day]: updated })
                                            }}
                                            placeholder="e.g., Morning, Evening, Sparring"
                                            className="text-sm"
                                          />
                                        </div>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const updated = sessions.filter((_, i) => i !== sessionIndex)
                                          setTrainingSchedule({ ...trainingSchedule, [day]: updated })
                                        }}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 mt-6"
                                      >
                                        Remove
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

            </CardContent>
          </Card>

          {/* Trainers */}
          <Card id="section-trainers" className="scroll-mt-6">
            <CardHeader>
              <CardTitle>Trainers</CardTitle>
              <CardDescription>List your trainers and their expertise (optional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Trainers (optional)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addTrainer}>
                  + Add Trainer
                </Button>
              </div>
              {trainers.map((trainer, index) => (
                <div key={index} className="grid md:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg max-w-4xl">
                  <Input
                    placeholder="Trainer name"
                    value={trainer.name}
                    onChange={(e) => updateTrainer(index, 'name', e.target.value)}
                  />
                  <Input
                    placeholder="Discipline"
                    value={trainer.discipline}
                    onChange={(e) => updateTrainer(index, 'discipline', e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Experience (e.g., 10 years)"
                      value={trainer.experience}
                      onChange={(e) => updateTrainer(index, 'experience', e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeTrainer(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card id="section-faq" className="scroll-mt-6">
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Add common questions and answers (optional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Frequently Asked Questions (optional)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addFaq}>
                  + Add Question
                </Button>
              </div>
                {faq.map((item, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3 max-w-4xl">
                    <Input
                      placeholder="Question"
                      value={item.question}
                      onChange={(e) => updateFaq(index, 'question', e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Answer"
                        value={item.answer}
                        onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                        rows={2}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeFaq(index)}
                        className="self-start"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
            </form>

            {/* Packages Section - Uses PackageManager with inline variant management */}
            {gym && gym.id && (
              <Card id="section-packages" className="scroll-mt-6 mt-6">
                <CardHeader>
                  <CardTitle>Packages & Offers</CardTitle>
                  <CardDescription>
                    Create and manage your training packages. Add room variants directly to packages for accommodation options.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PackagesSection 
                    gymId={gym.id} 
                    currency={gym.currency || 'USD'}
                    isAdmin={profile?.role === 'admin'}
                  />
                </CardContent>
              </Card>
            )}

            {/* Action Buttons - Outside form but can trigger form submission */}
            <div className="flex gap-4 pt-6 border-t mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/manage')}
                className="flex-1 md:flex-initial"
              >
                Cancel
              </Button>
              <Button 
                type="button"
                onClick={async () => {
                  // Call handleSave directly without event
                  await handleSave()
                }}
                disabled={saving}
                className="flex-1 md:flex-initial bg-[#003580] hover:bg-[#003580]/90"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function EditGymPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="space-y-4">
            <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="border border-gray-300 rounded-lg p-8 bg-white space-y-4">
              <div className="h-11 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-32 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    }>
      <EditGymForm />
    </Suspense>
  )
}
