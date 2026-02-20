'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { GymStepper } from './gym-stepper'
import type { CanonicalOfferType, Package } from '@/lib/types/database'
import { 
  Dumbbell, 
  BedDouble, 
  UtensilsCrossed, 
  Calendar, 
  DollarSign, 
  Eye,
  Check,
  X,
  Plus,
  Trash2
} from 'lucide-react'

const SPORTS = ['Muay Thai', 'MMA', 'BJJ', 'Boxing', 'Wrestling', 'Kickboxing', 'All Sports']
const CURRENCIES = ['USD', 'THB', 'EUR', 'GBP', 'AUD', 'IDR', 'JPY', 'CNY', 'SGD', 'MYR', 'NZD', 'CAD', 'HKD', 'INR', 'KRW', 'PHP', 'VND']

const OFFER_TYPES = [
  {
    id: 'TYPE_TRAINING_ONLY',
    name: 'Training Only',
    description: 'Training sessions only. No accommodation or meals.',
    icon: Dumbbell,
    color: 'blue',
  },
  {
    id: 'TYPE_TRAINING_ACCOM',
    name: 'Training + Accommodation',
    description: 'Training sessions + selectable room. Meals optional.',
    icon: BedDouble,
    color: 'green',
  },
  {
    id: 'TYPE_ALL_INCLUSIVE',
    name: 'All-Inclusive',
    description: 'Training + Room + Meals + Extras. One flat fee bundle.',
    icon: UtensilsCrossed,
    color: 'purple',
  },
  {
    id: 'TYPE_CUSTOM_EXP',
    name: 'Short-term Experience',
    description: 'Specialized camps, prep weeks, or fixed-date experiences.',
    icon: Calendar,
    color: 'orange',
  },
] as const


interface OfferStepperProps {
  gymId: string
  currency: string
  onComplete: () => void
  existingPackage?: Package | null
}

export function OfferStepper({ gymId, currency, onComplete, existingPackage }: OfferStepperProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [saving, setSaving] = useState(false)
  
  // Step 1: Offer Type
  const [selectedOfferType, setSelectedOfferType] = useState<CanonicalOfferType | null>(null)
  
  // Update min stay when offer type changes (only on initial selection, not when editing)
  useEffect(() => {
    if (!existingPackage && selectedOfferType) {
      if (selectedOfferType === 'TYPE_TRAINING_ONLY') {
        setMinStayDays(1)
      } else if (minStayDays === 1) {
        // Only update if currently at 1 (training-only default), otherwise keep user's choice
        setMinStayDays(7)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOfferType, existingPackage])
  
  // Step 2: Basic Info
  const [name, setName] = useState('')
  const [sport, setSport] = useState('Muay Thai')
  const [description, setDescription] = useState('')
  const [packageCurrency, setPackageCurrency] = useState(currency)
  
  // Step 3: Minimum Stay (defaults based on offer type)
  const [minStayDays, setMinStayDays] = useState(7)
  
  // Step 4: Pricing - day/week/month rates
  const [pricePerDay, setPricePerDay] = useState('')
  const [pricePerWeek, setPricePerWeek] = useState('')
  const [pricePerMonth, setPricePerMonth] = useState('')
  const [linkedAccommodationIds, setLinkedAccommodationIds] = useState<string[]>([])
  const [availableAccommodations, setAvailableAccommodations] = useState<any[]>([])
  
  // Step 5: Availability
  const [availableYearRound, setAvailableYearRound] = useState(true)
  const [blackoutDates, setBlackoutDates] = useState<Array<{ start: string; end: string; reason?: string }>>([])
  const [newBlackoutStart, setNewBlackoutStart] = useState('')
  const [newBlackoutEnd, setNewBlackoutEnd] = useState('')
  const [newBlackoutReason, setNewBlackoutReason] = useState('')
  
  // Step 5: Review
  const [bookingMode, setBookingMode] = useState<'request_to_book' | 'instant'>('request_to_book')
  
  const steps = [
    { id: 'type', label: 'Offer Type', number: 1 },
    { id: 'basic', label: 'Basic Info', number: 2 },
    { id: 'pricing', label: 'Pricing & Accommodation', number: 3 },
    { id: 'availability', label: 'Availability', number: 4 },
    { id: 'review', label: 'Review', number: 5 },
  ]
  
  // Load existing package data
  useEffect(() => {
    if (existingPackage) {
      setSelectedOfferType(existingPackage.offer_type || 'TYPE_TRAINING_ONLY')
      setName(existingPackage.name)
      setSport(existingPackage.sport)
      setDescription(existingPackage.description || '')
      setPackageCurrency(existingPackage.currency || currency)
      setAvailableYearRound(existingPackage.available_year_round ?? true)
      setBlackoutDates(existingPackage.blackout_dates || [])
      setBookingMode(existingPackage.booking_mode || 'request_to_book')
      
      // Load pricing - day/week/month rates
      setPricePerDay(existingPackage.price_per_day?.toString() || '')
      setPricePerWeek(existingPackage.price_per_week?.toString() || '')
      setPricePerMonth(existingPackage.price_per_month?.toString() || '')
      
      // Load linked accommodations
      loadLinkedAccommodations(existingPackage.id)
    }
  }, [existingPackage, currency])
  
  // Load linked accommodations for existing package
  const loadLinkedAccommodations = async (packageId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('package_accommodations')
      .select('accommodation_id')
      .eq('package_id', packageId)
    
    if (data) {
      setLinkedAccommodationIds(data.map(link => link.accommodation_id))
    }
  }
  
  // Load accommodations when needed
  useEffect(() => {
    if ((selectedOfferType === 'TYPE_TRAINING_ACCOM' || selectedOfferType === 'TYPE_ALL_INCLUSIVE') && currentStep >= 3) {
      loadAccommodations()
    }
  }, [selectedOfferType, currentStep])
  
  const loadAccommodations = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('accommodations')
      .select('*')
      .eq('gym_id', gymId)
      .eq('is_active', true)
      .order('name')
    
    if (data) {
      setAvailableAccommodations(data)
    }
  }
  
  const addBlackoutDate = () => {
    if (newBlackoutStart && newBlackoutEnd) {
      setBlackoutDates([
        ...blackoutDates,
        {
          start: newBlackoutStart,
          end: newBlackoutEnd,
          reason: newBlackoutReason || undefined,
        }
      ])
      setNewBlackoutStart('')
      setNewBlackoutEnd('')
      setNewBlackoutReason('')
    }
  }
  
  const removeBlackoutDate = (index: number) => {
    setBlackoutDates(blackoutDates.filter((_, i) => i !== index))
  }
  
  const handleSave = async () => {
    if (!selectedOfferType || !name.trim()) {
      alert('Please complete all required fields')
      return
    }
    
    // Validate pricing based on offer type
    if (selectedOfferType === 'TYPE_TRAINING_ONLY') {
      // Training-only: at least daily rate should be set
      if (!pricePerDay) {
        alert('Please enter a daily rate (price per session) for training-only packages.')
        return
      }
    } else {
      // Training+Accommodation and All-Inclusive: require at least weekly rate
      if (!pricePerWeek) {
        alert('Please enter a weekly rate. This is required for price calculation.')
        return
      }
    }
    
    // Set min_stay_days based on offer type (training-only is always 1)
    
    setSaving(true)
    const supabase = createClient()
    
    // Build payload
    const payload: any = {
      gym_id: gymId,
      name,
      description: description || null,
      sport,
      currency: packageCurrency,
      offer_type: selectedOfferType,
      min_stay_days: selectedOfferType === 'TYPE_TRAINING_ONLY' ? 1 : minStayDays,
      available_year_round: availableYearRound,
      blackout_dates: blackoutDates.length > 0 ? blackoutDates : [],
      booking_mode: bookingMode,
      // Set legacy type field for backward compatibility
      type: selectedOfferType === 'TYPE_TRAINING_ONLY' ? 'training' :
            selectedOfferType === 'TYPE_TRAINING_ACCOM' ? 'accommodation' :
            selectedOfferType === 'TYPE_ALL_INCLUSIVE' ? 'all_inclusive' : 'training',
      includes_accommodation: selectedOfferType === 'TYPE_TRAINING_ACCOM' || selectedOfferType === 'TYPE_ALL_INCLUSIVE',
      includes_meals: selectedOfferType === 'TYPE_ALL_INCLUSIVE',
      // Set day/week/month rates
      price_per_day: pricePerDay ? parseFloat(pricePerDay) : null,
      price_per_week: pricePerWeek ? parseFloat(pricePerWeek) : null,
      price_per_month: pricePerMonth ? parseFloat(pricePerMonth) : null,
    }
    
    try {
      let packageId: string
      
      if (existingPackage) {
        const { error } = await supabase
          .from('packages')
          .update(payload)
          .eq('id', existingPackage.id)
        
        if (error) throw error
        packageId = existingPackage.id
        
        // Remove existing links
        await supabase
          .from('package_accommodations')
          .delete()
          .eq('package_id', packageId)
      } else {
        const { error, data } = await supabase
          .from('packages')
          .insert(payload)
          .select()
          .single()
        
        if (error) throw error
        packageId = data.id
      }
      
      // Link accommodations via package_accommodations table (for TRAINING_ACCOM and ALL_INCLUSIVE)
      if (linkedAccommodationIds.length > 0 && (selectedOfferType === 'TYPE_TRAINING_ACCOM' || selectedOfferType === 'TYPE_ALL_INCLUSIVE')) {
        const links = linkedAccommodationIds.map((accId, index) => ({
          package_id: packageId,
          accommodation_id: accId,
          is_default: index === 0, // First one is default
        }))
        
        const { error: linkError } = await supabase
          .from('package_accommodations')
          .insert(links)
        
        if (linkError) {
          console.error('Error linking accommodations:', linkError)
          // Don't fail the whole save, just log the error
        }
      }
      
      onComplete()
    } catch (error: any) {
      alert(`Failed to save: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }
  
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedOfferType !== null
      case 2:
        return name.trim() !== '' && sport !== ''
      case 3:
        // For training-only, require daily rate; for others, require weekly rate
        if (selectedOfferType === 'TYPE_TRAINING_ONLY') {
          return pricePerDay !== ''
        }
        return pricePerWeek !== '' // At least weekly rate required for other types
      case 4:
        return true // Availability is optional
      case 5:
        return true
      default:
        return false
    }
  }
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Choose Your Offer Type</h3>
              <p className="text-sm text-gray-600 mb-6">
                Select the type of experience you're offering. This determines pricing and what's included.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {OFFER_TYPES.map((offer) => {
                const Icon = offer.icon
                const isSelected = selectedOfferType === offer.id
                return (
                  <button
                    key={offer.id}
                    type="button"
                    onClick={() => setSelectedOfferType(offer.id as CanonicalOfferType)}
                    className={`p-6 border-2 rounded-lg text-left transition-all ${
                      isSelected
                        ? 'border-[#003580] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-${offer.color}-100`}>
                        <Icon className={`w-6 h-6 text-${offer.color}-600`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{offer.name}</h4>
                          {isSelected && <Check className="w-5 h-5 text-[#003580]" />}
                        </div>
                        <p className="text-sm text-gray-600">{offer.description}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Basic Information</h3>
              <p className="text-sm text-gray-600 mb-6">
                Add how you advertise your gym — this helps guests find you.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Package Name *</Label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. 1 Month All-Inclusive Muay Thai"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sport *</Label>
                  <Select value={sport} onChange={e => setSport(e.target.value)}>
                    {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Currency *</Label>
                  <Select value={packageCurrency} onChange={e => setPackageCurrency(e.target.value)}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What's included? e.g. 2x training per day, Sunday off..."
                  rows={4}
                />
              </div>
            </div>
          </div>
        )
      
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Pricing & Accommodation</h3>
              <p className="text-sm text-gray-600 mb-6">
                Set your daily, weekly, and monthly rates. The system rounds up to the nearest week for stays.
              </p>
            </div>
            
            <div className="space-y-4">
              {selectedOfferType === 'TYPE_TRAINING_ONLY' ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Training-Only Package:</strong> Priced per session (per day). 
                    Set your daily rate below.
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Minimum stay:</strong> 1 week. Stays are rounded up to the nearest week for billing.
                  </p>
                </div>
              )}

              {/* Pricing - day/week/month rates */}
              <div className="border-t pt-4 space-y-4">
                <div>
                  <Label>Price per Day ({packageCurrency}) {selectedOfferType === 'TYPE_TRAINING_ONLY' ? <span className="text-red-500">*</span> : <span className="text-gray-400">(Optional)</span>}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={pricePerDay}
                    onChange={e => setPricePerDay(e.target.value)}
                    placeholder="0.00"
                    required={selectedOfferType === 'TYPE_TRAINING_ONLY'}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedOfferType === 'TYPE_TRAINING_ONLY' 
                      ? 'Per-session rate for drop-in training.' 
                      : 'Optional base daily rate for display purposes.'}
                  </p>
                </div>
                
                <div>
                  <Label>Price per Week ({packageCurrency}) {selectedOfferType !== 'TYPE_TRAINING_ONLY' ? <span className="text-red-500">*</span> : <span className="text-gray-400">(Optional)</span>}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={pricePerWeek}
                    onChange={e => setPricePerWeek(e.target.value)}
                    placeholder="0.00"
                    required={selectedOfferType !== 'TYPE_TRAINING_ONLY'}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Total price for a 7-day stay. This is the base rate for booking calculations.
                  </p>
                </div>
                
                <div>
                  <Label>Price per Month ({packageCurrency}) <span className="text-gray-400">(Optional)</span></Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={pricePerMonth}
                    onChange={e => setPricePerMonth(e.target.value)}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional. Discounted rate for 30-day stays.
                  </p>
                </div>
                
                {selectedOfferType !== 'TYPE_TRAINING_ONLY' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs text-blue-800">
                      <strong>How pricing works:</strong> Stays are rounded up to the nearest week. 
                      For example, an 11-day booking is billed as 2 weeks. Stays of 28+ days use the monthly rate if set.
                    </p>
                  </div>
                )}
              </div>

              {/* Accommodation Linking - for TRAINING_ACCOM and ALL_INCLUSIVE */}

              {/* Accommodation Linking - for TRAINING_ACCOM and ALL_INCLUSIVE */}
              {(selectedOfferType === 'TYPE_TRAINING_ACCOM' || selectedOfferType === 'TYPE_ALL_INCLUSIVE') && (
                <div className="border-t pt-4">
                  <Label className="mb-3 block">Link Accommodation Options</Label>
                  <p className="text-xs text-gray-600 mb-3">
                    {selectedOfferType === 'TYPE_TRAINING_ACCOM' 
                      ? 'Select which room types apply to this package. Guests will choose a room when booking.'
                      : 'Select which room types are included in this all-inclusive package. Guests will choose a room when booking.'}
                  </p>
                  {availableAccommodations.length > 0 ? (
                    <div className="space-y-2">
                      {availableAccommodations.map(acc => (
                        <label key={acc.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
                          <input
                            type="checkbox"
                            checked={linkedAccommodationIds.includes(acc.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setLinkedAccommodationIds([...linkedAccommodationIds, acc.id])
                              } else {
                                setLinkedAccommodationIds(linkedAccommodationIds.filter(id => id !== acc.id))
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{acc.name}</span>
                          <span className="text-xs text-gray-500 ml-auto">
                            {acc.price_per_week ? `${packageCurrency} ${acc.price_per_week}/week` : 'Price TBD'}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No accommodation options available. Create them in the Accommodation Manager first.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      
      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Availability & Operations</h3>
              <p className="text-sm text-gray-600 mb-6">
                Set when your offer is available and any blackout dates.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={availableYearRound}
                    onChange={e => setAvailableYearRound(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Available year-round</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Default to year-round availability. Use blackout dates below to exclude specific periods.
                </p>
              </div>
              
              <div className="border-t pt-4">
                <Label className="mb-3 block">Blackout Dates</Label>
                <p className="text-xs text-gray-600 mb-3">
                  Add date ranges when this offer is not available (e.g., holidays, maintenance).
                </p>
                <div className="space-y-3">
                  {blackoutDates.map((blackout, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded border">
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {blackout.start} to {blackout.end}
                        </div>
                        {blackout.reason && (
                          <div className="text-xs text-gray-500">{blackout.reason}</div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBlackoutDate(idx)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      type="date"
                      value={newBlackoutStart}
                      onChange={e => setNewBlackoutStart(e.target.value)}
                      placeholder="Start date"
                    />
                    <Input
                      type="date"
                      value={newBlackoutEnd}
                      onChange={e => setNewBlackoutEnd(e.target.value)}
                      placeholder="End date"
                    />
                    <div className="flex gap-2">
                      <Input
                        value={newBlackoutReason}
                        onChange={e => setNewBlackoutReason(e.target.value)}
                        placeholder="Reason (optional)"
                        className="flex-1"
                      />
                      <Button type="button" onClick={addBlackoutDate} size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Review & Publish</h3>
              <p className="text-sm text-gray-600 mb-6">
                Review your offer details and choose how bookings work.
              </p>
            </div>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Offer Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">
                      {OFFER_TYPES.find(t => t.id === selectedOfferType)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sport:</span>
                    <span className="font-medium">{sport}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Minimum Stay:</span>
                    <span className="font-medium">{selectedOfferType === 'TYPE_TRAINING_ONLY' ? '1 day' : '1 week'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pricing:</span>
                    <div className="text-right">
                      {pricePerDay && (
                        <div className="text-sm font-medium">/day: {packageCurrency} {parseFloat(pricePerDay).toLocaleString()}</div>
                      )}
                      {pricePerWeek && (
                        <div className="text-sm font-medium">/week: {packageCurrency} {parseFloat(pricePerWeek).toLocaleString()}</div>
                      )}
                      {pricePerMonth && (
                        <div className="text-sm font-medium">/month: {packageCurrency} {parseFloat(pricePerMonth).toLocaleString()}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Availability:</span>
                    <span className="font-medium">
                      {availableYearRound ? 'Year-round' : 'Limited'}
                    </span>
                  </div>
                  {blackoutDates.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Blackout Dates:</span>
                      <span className="font-medium">{blackoutDates.length}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <div>
                <Label>Booking Mode</Label>
                <Select
                  value={bookingMode}
                  onChange={e => setBookingMode(e.target.value as 'request_to_book' | 'instant')}
                >
                  <option value="request_to_book">Request to Book (Recommended)</option>
                  <option value="instant">Instant Confirmation</option>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Request-to-Book: Guests send a request, you approve, then payment is captured.
                  Instant: Payment is authorized immediately (requires real-time availability).
                </p>
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }
  
  // Calculate preview pricing
  const getPreviewPrice = () => {
    if (selectedOfferType === 'TYPE_TRAINING_ONLY' && pricePerDay) {
      return { 
        amount: parseFloat(pricePerDay) || 0, 
        period: 'per session', 
        label: 'Per session (starting from)' 
      }
    }
    if (pricePerWeek) {
      return { 
        amount: parseFloat(pricePerWeek) || 0, 
        period: 'per week', 
        label: 'Per week (starting from)' 
      }
    }
    return null
  }

  const previewPrice = getPreviewPrice()

  // Render preview pane
  const renderPreview = () => {
    if (!selectedOfferType) {
      return (
        <div className="bg-white rounded-lg border border-dashed p-8 text-center">
          <Eye className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Select an offer type to see preview</p>
        </div>
      )
    }

    const offerTypeInfo = OFFER_TYPES.find(t => t.id === selectedOfferType)
    const Icon = offerTypeInfo?.icon || Dumbbell

    return (
      <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
        {/* Package Image Placeholder */}
        <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <Icon className="w-16 h-16 text-gray-400" />
        </div>

        <div className="p-4 space-y-3">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-base text-gray-900 line-clamp-2 flex-1">
                {name || 'Package Name'}
              </h3>
              {offerTypeInfo && (
                <span className={`text-xs px-2 py-0.5 rounded font-medium ml-2 flex-shrink-0 ${
                  selectedOfferType === 'TYPE_TRAINING_ONLY' ? 'bg-blue-100 text-blue-700' :
                  selectedOfferType === 'TYPE_TRAINING_ACCOM' ? 'bg-green-100 text-green-700' :
                  selectedOfferType === 'TYPE_ALL_INCLUSIVE' ? 'bg-purple-100 text-purple-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {offerTypeInfo.name}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600">{sport}</p>
          </div>

          {/* Description */}
          {description && (
            <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
              {description}
            </p>
          )}

          {/* Includes */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {selectedOfferType !== 'TYPE_CUSTOM_EXP' && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Dumbbell className="w-3.5 h-3.5" />
                <span>Training</span>
              </div>
            )}
            {(selectedOfferType === 'TYPE_TRAINING_ACCOM' || selectedOfferType === 'TYPE_ALL_INCLUSIVE') && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <BedDouble className="w-3.5 h-3.5" />
                <span>Accommodation</span>
              </div>
            )}
            {selectedOfferType === 'TYPE_ALL_INCLUSIVE' && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Meals</span>
              </div>
            )}
          </div>

          {/* Minimum Stay & Pricing Info */}
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-500 mb-1">Minimum Stay: {selectedOfferType === 'TYPE_TRAINING_ONLY' ? '1 day' : '1 week'}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {pricePerDay && (
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                  /day: {packageCurrency} {parseFloat(pricePerDay).toLocaleString()}
                </span>
              )}
              {pricePerWeek && (
                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                  /week: {packageCurrency} {parseFloat(pricePerWeek).toLocaleString()}
                </span>
              )}
              {pricePerMonth && (
                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                  /month: {packageCurrency} {parseFloat(pricePerMonth).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Pricing */}
          {previewPrice && (
            <div className="pt-3 border-t">
              <div className="text-[10px] text-gray-500 mb-0.5">
                {previewPrice.label}
              </div>
              <div className="text-xl font-bold text-[#003580]">
                {packageCurrency} {previewPrice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                Includes taxes and charges
              </div>
            </div>
          )}

          {/* Availability */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Availability:</span>
              <span className={`font-medium ${
                availableYearRound ? 'text-green-600' : 'text-orange-600'
              }`}>
                {availableYearRound ? 'Year-round' : 'Limited'}
              </span>
            </div>
            {blackoutDates.length > 0 && (
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-gray-600">Blackout dates:</span>
                <span className="text-orange-600">{blackoutDates.length}</span>
              </div>
            )}
          </div>

          {/* Booking Mode */}
          <div className="pt-2 border-t">
            <div className="text-xs text-gray-600">
              <span className="font-medium">Booking:</span>{' '}
              {bookingMode === 'request_to_book' ? 'Request to Book' : 'Instant Confirmation'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <GymStepper
        currentStep={currentStep}
        steps={steps}
        onStepClick={(step) => {
          if (step <= currentStep) {
            setCurrentStep(step)
          }
        }}
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Form (2/3 on desktop) */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                {renderStepContent()}
                
                <div className="flex justify-between mt-8 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (currentStep > 1) {
                        setCurrentStep(currentStep - 1)
                      }
                    }}
                    disabled={currentStep === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex gap-2">
                    {currentStep < 5 ? (
                      <Button
                        onClick={() => {
                          if (canProceed()) {
                            setCurrentStep(currentStep + 1)
                          } else {
                            alert('Please complete all required fields')
                          }
                        }}
                        disabled={!canProceed()}
                        className="bg-[#003580] hover:bg-[#003580]/90"
                      >
                        Next
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSave}
                        disabled={saving || !canProceed()}
                        className="bg-[#003580] hover:bg-[#003580]/90"
                      >
                        {saving ? 'Saving...' : existingPackage ? 'Update Offer' : 'Create Offer'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Preview (1/3 on desktop, full width on mobile) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-gray-600" />
                    <CardTitle className="text-base">Live Preview</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    How guests will see this offer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderPreview()}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
