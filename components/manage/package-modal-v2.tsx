'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Package, PackageVariant } from '@/lib/types/database'
import { X, Plus, Trash2, Eye, Info, Sparkles } from 'lucide-react'

const SPORTS = ['Muay Thai', 'MMA', 'BJJ', 'Boxing', 'Wrestling', 'Kickboxing', 'All Sports']
const DURATION_OPTIONS = [
  { value: 7, label: '7 days (1 week)' },
  { value: 14, label: '14 days (2 weeks)' },
  { value: 15, label: '15 days' },
  { value: 30, label: '30 days (1 month)' },
  { value: 'custom', label: 'Custom duration' },
]

const PACKAGE_TEMPLATES = [
  {
    name: '1 Month All-Inclusive',
    sport: 'Muay Thai',
    type: 'all_inclusive',
    mode: 'fixed',
    durations: [{ days: 30, price: 30000 }],
    includes: { training: true, accommodation: true, meals: true },
  },
  {
    name: '2 Week Training + Stay',
    sport: 'Muay Thai',
    type: 'accommodation',
    mode: 'fixed',
    durations: [{ days: 14, price: 15000 }],
    includes: { training: true, accommodation: true, meals: false },
  },
  {
    name: 'Training Only (Rate-Based)',
    sport: 'Muay Thai',
    type: 'training',
    mode: 'rate',
    rates: { daily: 500, weekly: 3000, monthly: 10000 },
    includes: { training: true, accommodation: false, meals: false },
  },
]

interface PackageModalV2Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  gymId: string
  currency: string
  package?: Package | null
  onSave: () => void
}

type PackageMode = 'fixed' | 'rate'

interface FixedDuration {
  days: number | 'custom'
  customDays?: number
  price: number
  discountLabel?: string
}

export function PackageModalV2({ open, onOpenChange, gymId, currency, package: existingPackage, onSave }: PackageModalV2Props) {
  const [mode, setMode] = useState<PackageMode>('fixed')
  const [name, setName] = useState('')
  const [sport, setSport] = useState('Muay Thai')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'training' | 'accommodation' | 'all_inclusive'>('training')
  
  // Fixed mode state
  const [fixedDurations, setFixedDurations] = useState<FixedDuration[]>([{ days: 30, price: 0 }])
  
  // Rate mode state
  const [rateDaily, setRateDaily] = useState('')
  const [rateWeekly, setRateWeekly] = useState('')
  const [rateMonthly, setRateMonthly] = useState('')
  const [minStay, setMinStay] = useState(7)
  
  // Includes
  const [includesTraining, setIncludesTraining] = useState(true)
  const [includesAccommodation, setIncludesAccommodation] = useState(false)
  const [includesMeals, setIncludesMeals] = useState(false)
  
  // Accommodation linking
  const [linkedVariants, setLinkedVariants] = useState<string[]>([])
  const [availableVariants, setAvailableVariants] = useState<PackageVariant[]>([])
  
  // Other
  const [cancellationDays, setCancellationDays] = useState('')
  const [packageCurrency, setPackageCurrency] = useState(currency)
  
  useEffect(() => {
    if (existingPackage) {
      setName(existingPackage.name)
      setSport(existingPackage.sport)
      setDescription(existingPackage.description || '')
      setType(existingPackage.type)
      setPackageCurrency(existingPackage.currency || currency)
      setIncludesTraining(true)
      setIncludesAccommodation(existingPackage.includes_accommodation)
      setIncludesMeals(existingPackage.includes_meals)
      setCancellationDays(existingPackage.cancellation_policy_days?.toString() || '')
      
      // Determine mode from existing package
      // If package has explicit durations in pricing_config, it's fixed
      // Otherwise, it's rate-based
      // Create a deep copy to avoid readonly property issues
      if (existingPackage.pricing_config && typeof existingPackage.pricing_config === 'object') {
        const config = JSON.parse(JSON.stringify(existingPackage.pricing_config)) as any
        if (config.mode === 'fixed' && config.durations) {
          setMode('fixed')
          setFixedDurations(config.durations.map((d: any) => ({
            days: d.days,
            price: d.price,
            discountLabel: d.discountLabel,
          })))
        } else {
          setMode('rate')
          setRateDaily(existingPackage.price_per_day?.toString() || '')
          setRateWeekly(existingPackage.price_per_week?.toString() || '')
          setRateMonthly(existingPackage.price_per_month?.toString() || '')
          if (config.rates?.minStay) {
            setMinStay(config.rates.minStay)
          }
        }
      } else {
        // Legacy: assume rate-based if has prices
        setMode('rate')
        setRateDaily(existingPackage.price_per_day?.toString() || '')
        setRateWeekly(existingPackage.price_per_week?.toString() || '')
        setRateMonthly(existingPackage.price_per_month?.toString() || '')
      }
    } else {
      // Reset for new package
      setName('')
      setSport('Muay Thai')
      setDescription('')
      setType('training')
      setMode('fixed')
      setFixedDurations([{ days: 30, price: 0 }])
      setRateDaily('')
      setRateWeekly('')
      setRateMonthly('')
      setMinStay(7)
      setIncludesTraining(true)
      setIncludesAccommodation(false)
      setIncludesMeals(false)
      setLinkedVariants([])
      setCancellationDays('')
      setPackageCurrency(currency)
    }
  }, [existingPackage, currency])
  
  // Load available accommodation variants
  useEffect(() => {
    if (open && includesAccommodation) {
      loadVariants()
    }
  }, [open, includesAccommodation])
  
  const loadVariants = async () => {
    const supabase = createClient()
    const { data: packages } = await supabase
      .from('packages')
      .select('variants:package_variants(*)')
      .eq('gym_id', gymId)
      .eq('includes_accommodation', true)
    
    const allVariants: PackageVariant[] = []
    packages?.forEach(pkg => {
      if (pkg.variants) {
        allVariants.push(...(pkg.variants as PackageVariant[]))
      }
    })
    setAvailableVariants(allVariants)
  }
  
  const addFixedDuration = () => {
    setFixedDurations([...fixedDurations, { days: 30, price: 0 }])
  }
  
  const removeFixedDuration = (index: number) => {
    setFixedDurations(fixedDurations.filter((_, i) => i !== index))
  }
  
  const updateFixedDuration = (index: number, field: keyof FixedDuration, value: any) => {
    const updated = [...fixedDurations]
    updated[index] = { ...updated[index], [field]: value }
    setFixedDurations(updated)
  }
  
  const applyTemplate = (template: typeof PACKAGE_TEMPLATES[0]) => {
    setName(template.name)
    setSport(template.sport)
    setType(template.type as 'training' | 'accommodation' | 'all_inclusive')
    setMode(template.mode as PackageMode)
    setIncludesTraining(template.includes.training)
    setIncludesAccommodation(template.includes.accommodation)
    setIncludesMeals(template.includes.meals)
    
    if (template.mode === 'fixed' && template.durations) {
      setFixedDurations(template.durations.map(d => ({ days: d.days, price: d.price })))
    } else if (template.mode === 'rate' && template.rates) {
      setRateDaily(template.rates.daily?.toString() || '')
      setRateWeekly(template.rates.weekly?.toString() || '')
      setRateMonthly(template.rates.monthly?.toString() || '')
    }
  }
  
  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a package name')
      return
    }
    
    const supabase = createClient()
    
    // Build pricing_config based on mode
    // Create a fresh object to avoid readonly property issues
    let pricingConfig: any = { mode }
    
    if (mode === 'fixed') {
      pricingConfig.durations = fixedDurations.map(d => {
        const days = d.days === 'custom' ? (d.customDays || 0) : d.days
        return {
          days: typeof days === 'number' ? days : parseInt(String(days)) || 0,
          price: typeof d.price === 'number' ? d.price : parseFloat(String(d.price)) || 0,
          discountLabel: d.discountLabel || undefined,
        }
      })
    } else {
      pricingConfig.rates = {
        daily: rateDaily ? parseFloat(rateDaily) : null,
        weekly: rateWeekly ? parseFloat(rateWeekly) : null,
        monthly: rateMonthly ? parseFloat(rateMonthly) : null,
        minStay: minStay || 7,
      }
    }
    
    // Create a fresh payload object to avoid readonly property issues
    const payload: any = {
      gym_id: gymId,
      name: String(name),
      description: description ? String(description) : null,
      sport: String(sport),
      type: String(type),
      currency: String(packageCurrency),
      includes_accommodation: Boolean(includesAccommodation),
      includes_meals: Boolean(includesMeals),
      cancellation_policy_days: cancellationDays ? parseInt(String(cancellationDays)) : null,
      pricing_config: JSON.parse(JSON.stringify(pricingConfig)), // Deep copy to ensure it's not readonly
      // For backward compatibility, also set price fields
      price_per_day: mode === 'rate' && rateDaily ? parseFloat(String(rateDaily)) : null,
      price_per_week: mode === 'rate' && rateWeekly ? parseFloat(String(rateWeekly)) : null,
      price_per_month: mode === 'rate' && rateMonthly ? parseFloat(String(rateMonthly)) : null,
    }
    
    if (existingPackage) {
      const { error } = await supabase
        .from('packages')
        .update(payload)
        .eq('id', existingPackage.id)
      
      if (error) {
        alert(`Failed to update: ${error.message}`)
        return
      }
    } else {
      const { error } = await supabase
        .from('packages')
        .insert(payload)
        .select()
        .single()
      
      if (error) {
        alert(`Failed to create: ${error.message}`)
        return
      }
    }
    
    onSave()
    onOpenChange(false)
  }
  
  // Calculate preview price for rate-based
  const calculatePreviewPrice = (durationDays: number) => {
    if (mode !== 'rate') return null
    
    const daily = rateDaily ? parseFloat(rateDaily) : 0
    const weekly = rateWeekly ? parseFloat(rateWeekly) : 0
    const monthly = rateMonthly ? parseFloat(rateMonthly) : 0
    
    if (durationDays >= 28 && monthly) {
      return { price: monthly, unit: 'month', label: '1 month' }
    }
    if (durationDays >= 7 && weekly) {
      const weeks = Math.ceil(durationDays / 7)
      return { price: weeks * weekly, unit: 'week', label: `${weeks} week${weeks > 1 ? 's' : ''}` }
    }
    return { price: durationDays * daily, unit: 'day', label: `${durationDays} day${durationDays > 1 ? 's' : ''}` }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              {existingPackage ? 'Edit Package' : 'Create New Package'}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex">
          {/* Left Column: Form */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Templates */}
            {!existingPackage && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <Label className="text-sm font-semibold text-blue-900">Quick Start Templates</Label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {PACKAGE_TEMPLATES.map((template, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyTemplate(template)}
                      className="text-left p-2 bg-white rounded border border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-xs"
                    >
                      <div className="font-medium">{template.name}</div>
                      <div className="text-gray-500 mt-1">{template.mode === 'fixed' ? 'Fixed prices' : 'Rate-based'}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label>Package Name *</Label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. 1 Month All-Inclusive"
                />
                <p className="text-xs text-gray-500 mt-1">How you advertise this package</p>
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
                    <option value="USD">USD</option>
                    <option value="THB">THB</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="AUD">AUD</option>
                    <option value="IDR">IDR</option>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What's included? e.g. 2x training per day, Sunday off..."
                  rows={3}
                />
              </div>
            </div>
            
            {/* Mode Toggle */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Label className="text-base font-semibold">Pricing Mode</Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Does your gym sell defined packages (e.g. 1 week = THB X), or do you want us to calculate from your daily/weekly rates?
                  </p>
                </div>
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setMode('fixed')}
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                      mode === 'fixed' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
                    }`}
                  >
                    Fixed Package
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('rate')}
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                      mode === 'rate' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
                    }`}
                  >
                    Rate-Based
                  </button>
                </div>
              </div>
              
              {/* Fixed Mode */}
              {mode === 'fixed' && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Package Durations & Prices</Label>
                  {fixedDurations.map((duration, idx) => (
                    <div key={idx} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label className="text-xs text-gray-600">Duration</Label>
                        <Select
                          value={duration.days === 'custom' ? 'custom' : duration.days.toString()}
                          onChange={e => {
                            const val = e.target.value === 'custom' ? 'custom' : parseInt(e.target.value)
                            updateFixedDuration(idx, 'days', val)
                          }}
                        >
                          {DURATION_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </Select>
                        {duration.days === 'custom' && (
                          <Input
                            type="number"
                            placeholder="Days"
                            value={duration.customDays || ''}
                            onChange={e => updateFixedDuration(idx, 'customDays', parseInt(e.target.value))}
                            className="mt-2"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-gray-600">Price ({packageCurrency})</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={duration.price}
                          onChange={e => updateFixedDuration(idx, 'price', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-gray-600">Discount Label (optional)</Label>
                        <Input
                          placeholder="e.g. Early Bird"
                          value={duration.discountLabel || ''}
                          onChange={e => updateFixedDuration(idx, 'discountLabel', e.target.value)}
                        />
                      </div>
                      {fixedDurations.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFixedDuration(idx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addFixedDuration}>
                    <Plus className="w-4 h-4 mr-1" /> Add Duration
                  </Button>
                </div>
              )}
              
              {/* Rate-Based Mode */}
              {mode === 'rate' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Training Rate per Day</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={rateDaily}
                        onChange={e => setRateDaily(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Training Rate per Week</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={rateWeekly}
                        onChange={e => setRateWeekly(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Training Rate per Month</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={rateMonthly}
                        onChange={e => setRateMonthly(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Minimum Stay (days)</Label>
                    <Input
                      type="number"
                      value={minStay}
                      onChange={e => setMinStay(parseInt(e.target.value) || 7)}
                    />
                    <p className="text-xs text-gray-500 mt-1">Guests must book at least this many days</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Includes */}
            <div className="border-t pt-4">
              <Label className="text-base font-semibold mb-3 block">What's Included</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includesTraining}
                    onChange={e => setIncludesTraining(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Training</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includesAccommodation}
                    onChange={e => {
                      setIncludesAccommodation(e.target.checked)
                      if (!e.target.checked) {
                        setLinkedVariants([])
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">Accommodation</span>
                </label>
                {includesAccommodation && (
                  <div className="ml-6 mt-2 p-3 bg-gray-50 rounded border">
                    <Label className="text-sm font-medium mb-2 block">Link Accommodation Options</Label>
                    <p className="text-xs text-gray-600 mb-2">
                      If you include room(s), select which room types apply to this package. Guests will choose a room before requesting a booking.
                    </p>
                    {availableVariants.length > 0 ? (
                      <div className="space-y-2">
                        {availableVariants.map(variant => (
                          <label key={variant.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={linkedVariants.includes(variant.id)}
                              onChange={e => {
                                if (e.target.checked) {
                                  setLinkedVariants([...linkedVariants, variant.id])
                                } else {
                                  setLinkedVariants(linkedVariants.filter(id => id !== variant.id))
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{variant.name}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic">No accommodation variants available. Create them in the Accommodation manager first.</p>
                    )}
                  </div>
                )}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includesMeals}
                    onChange={e => setIncludesMeals(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Meals</span>
                </label>
              </div>
            </div>
            
            {/* Cancellation */}
            <div className="border-t pt-4">
              <Label>Free Cancellation Policy (Days Before Check-in)</Label>
              <Input
                type="number"
                value={cancellationDays}
                onChange={e => setCancellationDays(e.target.value)}
                placeholder="e.g. 5 (leave empty if no free cancellation)"
              />
              <p className="text-xs text-gray-500 mt-1">Number of days before check-in that guests can cancel for free</p>
            </div>
          </div>
          
          {/* Right Column: Preview */}
          <div className="w-80 border-l bg-gray-50 p-4 overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-4 h-4 text-gray-600" />
              <Label className="text-sm font-semibold">Preview</Label>
            </div>
            
            <div className="bg-white rounded-lg border shadow-sm p-4 space-y-3">
              <div>
                <h3 className="font-bold text-lg">{name || 'Package Name'}</h3>
                <p className="text-sm text-gray-600">{sport}</p>
              </div>
              
              {description && (
                <p className="text-sm text-gray-700">{description}</p>
              )}
              
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-500 uppercase">Includes</div>
                <div className="flex flex-wrap gap-2">
                  {includesTraining && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Training</span>}
                  {includesAccommodation && <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Accommodation</span>}
                  {includesMeals && <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">Meals</span>}
                </div>
              </div>
              
              <div className="border-t pt-3">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Pricing</div>
                {mode === 'fixed' ? (
                  <div className="space-y-2">
                    {fixedDurations.map((d, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-sm">
                          {d.days === 'custom' ? `${d.customDays || 0} days` : `${d.days} days`}
                          {d.discountLabel && (
                            <span className="ml-2 text-xs text-orange-600">({d.discountLabel})</span>
                          )}
                        </span>
                        <span className="font-bold text-[#003580]">
                          {packageCurrency} {d.price.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rateDaily && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Per day</span>
                        <span className="font-bold text-[#003580]">
                          {packageCurrency} {parseFloat(rateDaily).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {rateWeekly && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Per week</span>
                        <span className="font-bold text-[#003580]">
                          {packageCurrency} {parseFloat(rateWeekly).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {rateMonthly && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Per month</span>
                        <span className="font-bold text-[#003580]">
                          {packageCurrency} {parseFloat(rateMonthly).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {minStay > 0 && (
                      <p className="text-xs text-gray-500 mt-2">Minimum stay: {minStay} days</p>
                    )}
                  </div>
                )}
              </div>
              
              {cancellationDays && (
                <div className="border-t pt-3">
                  <div className="text-xs text-green-600">
                    ✓ Free cancellation {cancellationDays} days before check-in
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-[#003580] hover:bg-[#003580]/90">
            {existingPackage ? 'Update Package' : 'Create Package'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
