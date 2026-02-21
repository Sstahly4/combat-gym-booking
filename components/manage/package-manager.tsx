'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import type { Package, PackageVariant } from '@/lib/types/database'
import { Trash2, Edit2, Plus, Package as PackageIcon, BedDouble } from 'lucide-react'

const SPORTS = ['Muay Thai', 'MMA', 'BJJ', 'Boxing', 'Wrestling', 'Kickboxing', 'All Sports']
const PACKAGE_TYPES = [
  { value: 'training', label: 'Training Only' },
  { value: 'accommodation', label: 'Training + Accommodation' },
  { value: 'all_inclusive', label: 'All Inclusive (Training, Accom, Meals)' },
]

export function PackageManager({ gymId, currency }: { gymId: string | undefined, currency: string }) {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Ensure we have a valid gymId before allowing any operations
  const isValidGymId = !!gymId && typeof gymId === 'string' && gymId.trim() !== ''
  
  // Debug: Log gymId when component mounts or changes
  useEffect(() => {
    console.log('PackageManager mounted/updated: gymId =', gymId, 'type:', typeof gymId, 'isValidGymId:', isValidGymId)
    if (!isValidGymId) {
      console.error('PackageManager: Invalid gymId received!', gymId, 'Stack trace:', new Error().stack)
    }
  }, [gymId, isValidGymId])
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sport: 'Muay Thai',
    type: 'training' as 'training' | 'accommodation' | 'all_inclusive',
    price_per_day: '',
    price_per_week: '',
    price_per_month: '',
    currency: currency || 'USD',
    includes_accommodation: false,
    accommodation_name: '',
    includes_meals: false,
    min_stay_days: '7',
    cancellation_policy_days: '',
    meal_plan_details: {
      breakfast: false,
      lunch: false,
      dinner: false,
      meals_per_day: '',
      description: '',
    },
  })
  const [packageImage, setPackageImage] = useState<File | null>(null)
  const [existingPackageImage, setExistingPackageImage] = useState<string | null>(null)

  // Variants State
  const [variants, setVariants] = useState<PackageVariant[]>([])
  const [variantForm, setVariantForm] = useState({
    name: '',
    description: '',
    price_per_day: '',
    price_per_week: '',
    price_per_month: '',
    room_type: '' as 'private' | 'shared' | '',
  })
  const [variantImages, setVariantImages] = useState<File[]>([])
  const [existingVariantImages, setExistingVariantImages] = useState<string[]>([])
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null)
  const [showVariantForm, setShowVariantForm] = useState(false)

  const handleVariantImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    setVariantImages(prev => [...prev, ...files].slice(0, 5))
  }

  const removeVariantImage = (index: number) => {
    setVariantImages(prev => prev.filter((_, i) => i !== index))
  }

  const removeExistingVariantImage = (index: number) => {
    setExistingVariantImages(prev => prev.filter((_, i) => i !== index))
  }

  const startAddVariant = () => {
    setEditingVariantId(null)
    setVariantForm({
      name: '',
      description: '',
      price_per_day: '',
      price_per_week: '',
      price_per_month: '',
      room_type: '',
    })
    setVariantImages([])
    setExistingVariantImages([])
    setShowVariantForm(true)
  }

  const startEditVariant = (variant: PackageVariant) => {
    setEditingVariantId(variant.id)
    setVariantForm({
      name: variant.name,
      description: variant.description || '',
      price_per_day: variant.price_per_day?.toString() || '',
      price_per_week: variant.price_per_week?.toString() || '',
      price_per_month: variant.price_per_month?.toString() || '',
      room_type: variant.room_type || '',
    })
    setExistingVariantImages(variant.images || [])
    setVariantImages([])
    setShowVariantForm(true)
  }

  const cancelVariantEdit = () => {
    setEditingVariantId(null)
    setVariantImages([])
    setExistingVariantImages([])
    setVariantForm({
      name: '',
      description: '',
      price_per_day: '',
      price_per_week: '',
      price_per_month: '',
      room_type: '',
    })
    setShowVariantForm(false)
  }

  useEffect(() => {
    fetchPackages()
  }, [gymId])

  const fetchPackages = async () => {
    if (!isValidGymId) {
      console.warn('PackageManager: Cannot fetch packages - no gymId provided', { gymId, isValidGymId })
      setLoading(false)
      return
    }
    
    const supabase = createClient()
    const { data } = await supabase
      .from('packages')
      .select('*, variants:package_variants(*)')
      .eq('gym_id', gymId)
      .order('created_at')

    if (data) setPackages(data)
    setLoading(false)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sport: 'Muay Thai',
      type: 'training',
      price_per_day: '',
      price_per_week: '',
      price_per_month: '',
      currency: currency || 'USD',
      includes_accommodation: false,
      accommodation_name: '',
      includes_meals: false,
      min_stay_days: '7',
      cancellation_policy_days: '',
      meal_plan_details: {
        breakfast: false,
        lunch: false,
        dinner: false,
        meals_per_day: '',
        description: '',
      },
    })
    setPackageImage(null)
    setExistingPackageImage(null)
    setEditingId(null)
    setVariants([])
    setShowVariantForm(false)
    setVariantImages([])
    setExistingVariantImages([])
    setEditingVariantId(null)
  }

  const handleEdit = (pkg: Package) => {
    setFormData({
      name: pkg.name,
      description: pkg.description || '',
      sport: pkg.sport,
      type: pkg.type,
      price_per_day: pkg.price_per_day?.toString() || '',
      price_per_week: pkg.price_per_week?.toString() || '',
      price_per_month: pkg.price_per_month?.toString() || '',
      currency: pkg.currency || currency || 'USD',
      includes_accommodation: pkg.includes_accommodation,
      accommodation_name: pkg.accommodation_name || '',
      includes_meals: pkg.includes_meals,
      min_stay_days: pkg.min_stay_days?.toString() || (pkg.type === 'training' ? '1' : '7'),
      cancellation_policy_days: pkg.cancellation_policy_days?.toString() || '',
      meal_plan_details: pkg.meal_plan_details ? {
        breakfast: pkg.meal_plan_details.breakfast ?? false,
        lunch: pkg.meal_plan_details.lunch ?? false,
        dinner: pkg.meal_plan_details.dinner ?? false,
        meals_per_day: pkg.meal_plan_details.meals_per_day?.toString() || '',
        description: pkg.meal_plan_details.description || '',
      } : {
        breakfast: false,
        lunch: false,
        dinner: false,
        meals_per_day: '',
        description: '',
      },
    })
    setExistingPackageImage(pkg.image || null)
    setPackageImage(null)
    setVariants(pkg.variants || [])
    setEditingId(pkg.id)
  }

  const handlePackageImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    setPackageImage(e.target.files[0])
    setExistingPackageImage(null) // Clear existing when new one is selected
  }

  const removePackageImage = () => {
    setPackageImage(null)
    setExistingPackageImage(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return
    
    const supabase = createClient()
    const { error } = await supabase.from('packages').delete().eq('id', id)
    
    if (error) {
      alert('Failed to delete package')
    } else {
      fetchPackages()
    }
  }

  // Variant Handlers
  const handleVariantSubmit = async () => {
    if (!editingId) return // Should only add variants to existing packages for now to keep simple
    
    const supabase = createClient()

    // Upload selected images (if any)
    let uploadedUrls: string[] = []
    if (variantImages.length > 0) {
      const uploadPromises = variantImages.map(async (image, index) => {
        try {
          const fileExt = image.name.split('.').pop()
          const fileName = `variants/${editingId}/${Date.now()}-${index}.${fileExt}`
          const { error: uploadError } = await supabase.storage
            .from('gym-images')
            .upload(fileName, image)

          if (uploadError) throw uploadError

          const { data } = supabase.storage
            .from('gym-images')
            .getPublicUrl(fileName)

          return data.publicUrl
        } catch (e) {
          console.error('Failed to upload variant image:', e)
          return null
        }
      })

      const results = await Promise.all(uploadPromises)
      uploadedUrls = results.filter(Boolean) as string[]
    }

    const imagesToSave = [...existingVariantImages, ...uploadedUrls]

    // Parse prices (and optionally derive a daily price from weekly/monthly if not provided).
    // This prevents overcharging on "month + a few extra days" stays when daily is missing.
    const parsedWeek = variantForm.price_per_week ? parseFloat(variantForm.price_per_week) : null
    const parsedMonth = variantForm.price_per_month ? parseFloat(variantForm.price_per_month) : null
    let parsedDay = variantForm.price_per_day ? parseFloat(variantForm.price_per_day) : null

    // Currency-aware rounding:
    // - Most currencies: 2 decimals
    // - 0-decimal currencies (common): round to whole units
    const priceCurrency = formData.currency || currency || 'USD'
    const roundPrice = (value: number) => {
      const zeroDecimal = new Set(['THB', 'JPY', 'VND', 'IDR', 'KRW'])
      const decimals = zeroDecimal.has(priceCurrency) ? 0 : 2
      const factor = Math.pow(10, decimals)
      return Math.round(value * factor) / factor
    }

    // Auto-derive daily if missing/invalid
    if (parsedDay === null || !Number.isFinite(parsedDay) || parsedDay <= 0) {
      if (parsedWeek && Number.isFinite(parsedWeek) && parsedWeek > 0) {
        parsedDay = roundPrice(parsedWeek / 7)
      } else if (parsedMonth && Number.isFinite(parsedMonth) && parsedMonth > 0) {
        parsedDay = roundPrice(parsedMonth / 30)
      } else {
        parsedDay = null
      }
    }

    const payload = {
      package_id: editingId,
      name: variantForm.name,
      description: variantForm.description || null,
      price_per_day: parsedDay,
      price_per_week: parsedWeek,
      price_per_month: parsedMonth,
      room_type: variantForm.room_type || null,
      images: imagesToSave,
    }

    if (editingVariantId) {
      const { error } = await supabase
        .from('package_variants')
        .update(payload)
        .eq('id', editingVariantId)
      
      if (error) alert('Failed to update variant')
    } else {
      const { error } = await supabase
        .from('package_variants')
        .insert(payload)
      
      if (error) alert('Failed to create variant')
    }

    // Refresh packages to get updated variants
    fetchPackages()
    
    // Reset variant form
    setVariantForm({
      name: '',
      description: '',
      price_per_day: '',
      price_per_week: '',
      price_per_month: '',
      room_type: '',
    })
    setEditingVariantId(null)
    setShowVariantForm(false)
    setVariantImages([])
    setExistingVariantImages([])
  }

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('Delete this variant?')) return
    
    const supabase = createClient()
    const { error } = await supabase.from('package_variants').delete().eq('id', variantId)
    
    if (error) {
      alert('Failed to delete variant')
    } else {
      fetchPackages()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('🔵 handleSubmit FUNCTION CALLED')
    console.log('Event:', e)
    console.log('gymId prop:', gymId)
    console.log('gymId type:', typeof gymId)
    
    try {
      // Re-validate gymId at submission time (don't rely on closure)
      const currentGymId = gymId
      const isGymIdValid = !!currentGymId && typeof currentGymId === 'string' && currentGymId.trim() !== ''
      
      console.log('=== PACKAGE SUBMIT START ===')
      console.log('handleSubmit called, gymId:', currentGymId, 'type:', typeof currentGymId, 'isGymIdValid:', isGymIdValid)
      console.log('formData:', formData)
      console.log('Validation check:', {
        gymId: currentGymId,
        isTruthy: !!currentGymId,
        isString: typeof currentGymId === 'string',
        notEmpty: typeof currentGymId === 'string' ? currentGymId.trim() !== '' : false,
        finalValid: isGymIdValid
      })
      
      // More robust check: gymId must be a non-empty string
      if (!isGymIdValid) {
        console.error('❌ VALIDATION FAILED: No gymId provided!')
        console.error('gymId value:', currentGymId, 'type:', typeof currentGymId, 'isGymIdValid:', isGymIdValid)
        console.error('Component state at time of error:', { gymId: currentGymId, isValidGymId, isGymIdValid })
        alert(`Error: No gym ID provided. Please refresh the page and try again.\n\nDebug info: gymId = ${currentGymId}, type = ${typeof currentGymId}`)
        return
      }
      
      console.log('✅ Validation passed, proceeding with package creation...')
      const supabase = createClient()

      // Upload package image if provided
      let imageUrl = existingPackageImage
    if (packageImage) {
      try {
        const fileExt = packageImage.name.split('.').pop()
        const fileName = `packages/${currentGymId}/${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('gym-images')
          .upload(fileName, packageImage)

        if (uploadError) throw uploadError

        const { data } = supabase.storage
          .from('gym-images')
          .getPublicUrl(fileName)

        imageUrl = data.publicUrl
      } catch (e) {
        console.error('Failed to upload package image:', e)
        alert('Failed to upload package image. Please try again.')
        return
      }
    }

      // Build meal plan details object
      const mealPlanDetails = (formData.includes_meals || formData.type === 'all_inclusive') ? {
      breakfast: formData.meal_plan_details.breakfast,
      lunch: formData.meal_plan_details.lunch,
      dinner: formData.meal_plan_details.dinner,
      meals_per_day: formData.meal_plan_details.meals_per_day ? parseInt(formData.meal_plan_details.meals_per_day) : undefined,
      description: formData.meal_plan_details.description || undefined,
    } : null

      // Map legacy type to canonical offer_type (required by DB constraint)
      const offerTypeMap: Record<string, string> = {
        training: 'TYPE_TRAINING_ONLY',
        accommodation: 'TYPE_TRAINING_ACCOM',
        all_inclusive: 'TYPE_ALL_INCLUSIVE',
      }

      const payload = {
        gym_id: currentGymId,
      name: formData.name,
      description: formData.description || null,
      sport: formData.sport,
      type: formData.type,
      offer_type: offerTypeMap[formData.type] || 'TYPE_TRAINING_ONLY',
      price_per_day: formData.price_per_day ? parseFloat(formData.price_per_day) : null,
      price_per_week: formData.price_per_week ? parseFloat(formData.price_per_week) : null,
      price_per_month: formData.price_per_month ? parseFloat(formData.price_per_month) : null,
      currency: formData.currency || currency || 'USD',
      includes_accommodation: formData.type !== 'training', // Auto-set based on type
      accommodation_name: formData.type !== 'training' ? formData.accommodation_name : null,
      includes_meals: formData.type === 'all_inclusive' || formData.includes_meals,
      min_stay_days: formData.min_stay_days ? parseInt(formData.min_stay_days) : (formData.type === 'training' ? 1 : 7),
      cancellation_policy_days: formData.cancellation_policy_days ? parseInt(formData.cancellation_policy_days) : null,
      meal_plan_details: mealPlanDetails,
        image: imageUrl,
      }

      console.log('Submitting package payload:', payload)

      let currentPackageId = editingId

      if (editingId) {
        const { error } = await supabase
          .from('packages')
          .update(payload)
          .eq('id', editingId)
        
        if (error) {
          console.error('Package update error:', error)
          alert(`Failed to update package: ${error.message}`)
          return
        }
      } else {
        const { error, data } = await supabase
          .from('packages')
          .insert(payload)
          .select()
          .single()
        
        if (error) {
          console.error('Package create error:', error)
          alert(`Failed to create package: ${error.message}`)
          return
        }
        console.log('Package created successfully:', data)
        currentPackageId = data.id
        setEditingId(data.id) // Switch to edit mode to allow adding variants
      }

      fetchPackages()
      // Don't reset form if we just created it, so user can add variants
      if (editingId) {
         resetForm()
      } else {
         alert('Package created! You can now add accommodation variants if needed.')
      }
      console.log('=== PACKAGE SUBMIT SUCCESS ===')
    } catch (error: any) {
      console.error('=== PACKAGE SUBMIT ERROR ===')
      console.error('Unexpected error during package submission:', error)
      alert(`An unexpected error occurred: ${error?.message || 'Unknown error'}. Please check the console for details.`)
    }
  }

  // Early return if no valid gymId (but show loading state instead of error)
  if (!isValidGymId) {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800 font-medium">
            Loading gym information... Please wait.
            <br />
            <span className="text-xs opacity-75">(gymId: {gymId || 'undefined'})</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <PackageIcon className="w-5 h-5" />
          Packages & Offers
        </h3>
      </div>

      {/* Package List */}
      <div className="grid gap-4">
        {packages.map(pkg => (
          <Card key={pkg.id} className="relative group border-l-4 border-l-[#003580]">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-lg">{pkg.name}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      pkg.type === 'training' ? 'bg-gray-100 text-gray-700' :
                      pkg.type === 'accommodation' ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {pkg.type === 'training' ? 'Training Only' :
                       pkg.type === 'accommodation' ? 'Training + Stay' : 'All Inclusive'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{pkg.sport}</p>
                  <p className="text-sm mt-1">{pkg.description}</p>
                  
                  {/* Variants Preview */}
                  {pkg.variants && pkg.variants.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Accommodation Options:</p>
                      {pkg.variants.map(v => (
                        <div key={v.id} className="text-sm flex items-center gap-2">
                          <BedDouble className="w-3 h-3 text-gray-400" />
                          <span>{v.name}</span>
                          <span className="text-gray-400">-</span>
                          <span className="font-medium">
                            {v.price_per_month ? `${v.price_per_month} /mo` : `${v.price_per_day} /day`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="text-right">
                  {pkg.variants && pkg.variants.length > 0 ? (
                    <div className="text-sm text-gray-500 italic">See variants</div>
                  ) : (
                    <div className="font-bold text-[#003580]">
                      {pkg.price_per_month ? (
                        <div>{pkg.price_per_month} {pkg.currency || currency} /mo</div>
                      ) : pkg.price_per_week ? (
                        <div>{pkg.price_per_week} {pkg.currency || currency} /wk</div>
                      ) : (
                        <div>{pkg.price_per_day} {pkg.currency || currency} /day</div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2 justify-end mt-4">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(pkg)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(pkg.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {packages.length === 0 && !loading && (
          <div className="text-center py-8 bg-gray-50 border border-dashed rounded-lg">
            No packages yet. Create one below.
          </div>
        )}
      </div>

      {/* Form */}
      <Card className="bg-gray-50 border-dashed">
        <CardContent className="p-6">
          <h4 className="font-semibold mb-4">{editingId ? 'Edit Package' : 'Add New Package'}</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Package Name *</Label>
                <Input 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Muay Thai Monthly"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>Sport *</Label>
                <Select 
                  value={formData.sport}
                  onChange={e => setFormData({...formData, sport: e.target.value})}
                >
                  {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Offer Type *</Label>
                <Select 
                  value={formData.type}
                  onChange={e => {
                    const newType = e.target.value as 'training' | 'accommodation' | 'all_inclusive'
                    setFormData({
                      ...formData, 
                      type: newType,
                      // Auto-set min stay: 1 day for training, 7 days for accommodation/all-inclusive
                      min_stay_days: newType === 'training' ? '1' : '7',
                    })
                  }}
                >
                  {PACKAGE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Currency *</Label>
                <Select 
                  value={formData.currency}
                  onChange={e => setFormData({...formData, currency: e.target.value})}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="THB">THB - Thai Baht</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                  <option value="IDR">IDR - Indonesian Rupiah</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                  <option value="CNY">CNY - Chinese Yuan</option>
                  <option value="SGD">SGD - Singapore Dollar</option>
                  <option value="MYR">MYR - Malaysian Ringgit</option>
                  <option value="NZD">NZD - New Zealand Dollar</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="HKD">HKD - Hong Kong Dollar</option>
                  <option value="INR">INR - Indian Rupee</option>
                  <option value="KRW">KRW - South Korean Won</option>
                  <option value="PHP">PHP - Philippine Peso</option>
                  <option value="VND">VND - Vietnamese Dong</option>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="What's included? e.g. 2x training per day, Sunday off..."
              />
            </div>

            {/* Package Display Image */}
            <div className="space-y-3 border-t pt-4">
              <div>
                <Label className="text-base font-semibold">Package Display Image</Label>
                <p className="text-xs text-muted-foreground mt-1 mb-3">
                  This image will be displayed on the package card. Recommended: 800x600px or similar aspect ratio.
                </p>
                
                {/* File Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#003580] transition-colors">
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePackageImageUpload}
                    className="hidden"
                    id="package-image-upload"
                  />
                  <label 
                    htmlFor="package-image-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#003580]/10 flex items-center justify-center">
                      <Plus className="w-5 h-5 text-[#003580]" />
                    </div>
                    <div className="text-sm font-medium text-gray-700">
                      {existingPackageImage || packageImage ? 'Change image' : 'Click to upload package image'}
                    </div>
                    <div className="text-xs text-gray-500">
                      PNG, JPG up to 5MB
                    </div>
                  </label>
                </div>
              </div>

              {/* Image Preview */}
              {(existingPackageImage || packageImage) && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Current Image</p>
                  <div className="relative inline-block group">
                    <div className="w-48 h-36 bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={packageImage ? URL.createObjectURL(packageImage) : existingPackageImage || ''} 
                        alt="Package preview"
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removePackageImage}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      title="Remove image"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    {packageImage ? 'New image will be uploaded when you save.' : 'This image is currently displayed on the package card.'}
                  </p>
                </div>
              )}
            </div>

            {/* Price Fields for All Package Types */}
            <div className="grid md:grid-cols-3 gap-4 bg-white p-4 rounded border">
              <div className="space-y-2">
                <Label>Price per Day</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  value={formData.price_per_day}
                  onChange={e => setFormData({...formData, price_per_day: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Price per Week</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  value={formData.price_per_week}
                  onChange={e => setFormData({...formData, price_per_week: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Price per Month</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  value={formData.price_per_month}
                  onChange={e => setFormData({...formData, price_per_month: e.target.value})}
                  placeholder="0.00"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 -mt-2 px-4">
              Set at least one price (day, week, or month). Prices are in {formData.currency}.
            </p>

            {/* Minimum Stay */}
            <div className="space-y-2">
              <Label>Minimum Stay (Days)</Label>
              <Input 
                type="number" 
                min="1"
                step="1"
                placeholder={formData.type === 'training' ? '1' : '7'}
                value={formData.min_stay_days}
                onChange={e => setFormData({...formData, min_stay_days: e.target.value})}
              />
              <p className="text-xs text-gray-500">
                {formData.type === 'training' 
                  ? 'Minimum number of training sessions/days. Default: 1.' 
                  : 'Minimum number of days for a booking. Default: 7 (1 week). Guests cannot book fewer days than this.'}
              </p>
            </div>

            {/* Cancellation Policy */}
            <div className="space-y-2">
              <Label>Free Cancellation Policy (Days Before Check-in)</Label>
              <Input 
                type="number" 
                placeholder="e.g. 5 (leave empty if no free cancellation)"
                value={formData.cancellation_policy_days}
                onChange={e => setFormData({...formData, cancellation_policy_days: e.target.value})}
              />
              <p className="text-xs text-gray-500">Number of days before check-in that guests can cancel for free. Leave empty if no free cancellation policy.</p>
            </div>

            {/* Meal Plan Details (if includes meals) */}
            {(formData.includes_meals || formData.type === 'all_inclusive') && (
              <div className="space-y-4 bg-white p-4 rounded border">
                <h5 className="font-semibold text-sm">Meal Plan Details</h5>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.meal_plan_details.breakfast}
                        onChange={e => setFormData({
                          ...formData,
                          meal_plan_details: {...formData.meal_plan_details, breakfast: e.target.checked}
                        })}
                        className="rounded"
                      />
                      <span className="text-sm">Breakfast</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.meal_plan_details.lunch}
                        onChange={e => setFormData({
                          ...formData,
                          meal_plan_details: {...formData.meal_plan_details, lunch: e.target.checked}
                        })}
                        className="rounded"
                      />
                      <span className="text-sm">Lunch</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.meal_plan_details.dinner}
                        onChange={e => setFormData({
                          ...formData,
                          meal_plan_details: {...formData.meal_plan_details, dinner: e.target.checked}
                        })}
                        className="rounded"
                      />
                      <span className="text-sm">Dinner</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Meals per Day</Label>
                      <Input 
                        type="number" 
                        placeholder="e.g. 2"
                        value={formData.meal_plan_details.meals_per_day}
                        onChange={e => setFormData({
                          ...formData,
                          meal_plan_details: {...formData.meal_plan_details, meals_per_day: e.target.value}
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Custom Description (optional)</Label>
                      <Input 
                        placeholder="e.g. 2 meals per day (lunch and dinner)"
                        value={formData.meal_plan_details.description}
                        onChange={e => setFormData({
                          ...formData,
                          meal_plan_details: {...formData.meal_plan_details, description: e.target.value}
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Variants Section (Only for Accommodation / All Inclusive) */}
            {editingId && formData.type !== 'training' && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <h5 className="font-semibold text-sm">Accommodation Options</h5>
                  <Button type="button" size="sm" variant="outline" onClick={startAddVariant}>
                    <Plus className="w-4 h-4 mr-1" /> Add Option
                  </Button>
                </div>

                {showVariantForm && (
                  <div className="bg-white p-4 rounded border space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        {editingVariantId ? 'Edit accommodation option' : 'Add accommodation option'}
                      </p>
                      <Button type="button" size="sm" variant="ghost" onClick={cancelVariantEdit}>
                        Close
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label>Option Name</Label>
                      <Input 
                        placeholder="e.g. Standard Fan Room"
                        value={variantForm.name}
                        onChange={e => setVariantForm({...variantForm, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Describe the room/accommodation..."
                        value={variantForm.description}
                        onChange={e => setVariantForm({ ...variantForm, description: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Input 
                        placeholder="Daily Price" 
                        type="number"
                        step="0.01"
                        value={variantForm.price_per_day}
                        onChange={e => setVariantForm({...variantForm, price_per_day: e.target.value})}
                      />
                      <Input 
                        placeholder="Weekly Price" 
                        type="number"
                        step="0.01"
                        value={variantForm.price_per_week}
                        onChange={e => setVariantForm({...variantForm, price_per_week: e.target.value})}
                      />
                      <Input 
                        placeholder="Monthly Price" 
                        type="number"
                        step="0.01"
                        value={variantForm.price_per_month}
                        onChange={e => setVariantForm({...variantForm, price_per_month: e.target.value})}
                      />
                    </div>
                    
                    {/* Image Upload for Variants */}
                    <div className="space-y-3 border-t pt-4">
                      <div>
                        <Label className="text-sm font-semibold">Accommodation Images</Label>
                        <p className="text-xs text-muted-foreground mt-1 mb-3">
                          Add up to 5 images of this accommodation option. Recommended: 800x600px or similar.
                        </p>
                        
                        {/* File Upload */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#003580] transition-colors">
                          <Input 
                            type="file" 
                            accept="image/*" 
                            multiple
                            onChange={handleVariantImageUpload}
                            className="hidden"
                            id="variant-image-upload"
                          />
                          <label 
                            htmlFor="variant-image-upload"
                            className="cursor-pointer flex flex-col items-center gap-2"
                          >
                            <div className="w-10 h-10 rounded-full bg-[#003580]/10 flex items-center justify-center">
                              <Plus className="w-5 h-5 text-[#003580]" />
                            </div>
                            <div className="text-sm font-medium text-gray-700">
                              {variantImages.length > 0 || existingVariantImages.length > 0 
                                ? `Add more images (${variantImages.length + existingVariantImages.length}/5)` 
                                : 'Click to upload images'}
                            </div>
                            <div className="text-xs text-gray-500">
                              PNG, JPG up to 5MB each (max 5 images)
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Image Previews */}
                      {(existingVariantImages.length > 0 || variantImages.length > 0) && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Images ({existingVariantImages.length + variantImages.length}/5)
                          </p>
                          <div className="grid grid-cols-3 gap-3">
                            {/* Existing Images */}
                            {existingVariantImages.map((imgUrl, index) => (
                              <div key={`existing-${index}`} className="relative group">
                                <div className="w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                  <img 
                                    src={imgUrl} 
                                    alt={`Existing ${index + 1}`}
                                    className="w-full h-full object-cover" 
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeExistingVariantImage(index)}
                                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                  title="Remove image"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            {/* New Images */}
                            {variantImages.map((img, index) => (
                              <div key={`new-${index}`} className="relative group">
                                <div className="w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                  <img 
                                    src={URL.createObjectURL(img)} 
                                    alt={`New ${index + 1}`}
                                    className="w-full h-full object-cover" 
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeVariantImage(index)}
                                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                  title="Remove image"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-2">
                            {variantImages.length > 0 
                              ? `${variantImages.length} new image(s) will be uploaded when you save.` 
                              : 'These images are currently displayed for this accommodation option.'}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button type="button" size="sm" variant="ghost" onClick={cancelVariantEdit}>Cancel</Button>
                      <Button type="button" size="sm" onClick={handleVariantSubmit}>Save Option</Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {variants.map(v => (
                    <div key={v.id} className="flex gap-3 items-center bg-white p-3 rounded border text-sm">
                      {/* Image Preview */}
                      <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden relative">
                        {v.images && v.images.length > 0 ? (
                          <img 
                            src={v.images[0]} 
                            alt={v.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <BedDouble className="w-6 h-6" />
                          </div>
                        )}
                        {v.images && v.images.length > 1 && (
                          <div className="absolute bottom-0 right-0 bg-[#003580] text-white text-[10px] px-1.5 py-0.5 rounded-tl">
                            +{v.images.length - 1}
                          </div>
                        )}
                      </div>
                      
                      {/* Variant Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{v.name}</div>
                        <div className="text-muted-foreground text-xs mt-0.5">
                          {v.price_per_month ? `${v.price_per_month} ${formData.currency || currency}/mo` : v.price_per_week ? `${v.price_per_week} ${formData.currency || currency}/wk` : v.price_per_day ? `${v.price_per_day} ${formData.currency || currency}/day` : 'No price set'}
                        </div>
                        {v.images && v.images.length > 0 ? (
                          <div className="text-[10px] text-green-600 mt-1">
                            {v.images.length} {v.images.length === 1 ? 'image' : 'images'}
                          </div>
                        ) : (
                          <div className="text-[10px] text-orange-600 mt-1">
                            No images - click edit to add
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button type="button" variant="ghost" size="sm" onClick={() => startEditVariant(v)} title="Edit variant and images">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleDeleteVariant(v.id)} title="Delete variant">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {variants.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">No accommodation options added yet.</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button 
                type="submit"
                onClick={(e) => {
                  console.log('Button clicked! gymId:', gymId, 'type:', typeof gymId)
                  // Let the form handle submission
                }}
              >
                {editingId ? 'Update Package' : 'Create Package'}
              </Button>
              {editingId && (
                <Button type="button" variant="ghost" onClick={resetForm}>
                  Close / Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}