'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  BedDouble, 
  Plus, 
  Edit2, 
  Trash2, 
  Upload, 
  X, 
  Download,
  Check,
  AlertCircle
} from 'lucide-react'

const ROOM_TYPES = [
  { value: 'private', label: 'Private Room' },
  { value: 'shared', label: 'Shared Room' },
  { value: 'dorm', label: 'Dormitory' },
]

const CURRENCIES = ['USD', 'THB', 'EUR', 'GBP', 'AUD', 'IDR', 'JPY', 'CNY', 'SGD', 'MYR', 'NZD', 'CAD', 'HKD', 'INR', 'KRW', 'PHP', 'VND']

interface Accommodation {
  id: string
  gym_id: string
  name: string
  description: string | null
  room_type: 'private' | 'shared' | 'dorm' | null
  capacity: number | null
  price_per_day: number | null
  price_per_week: number | null
  price_per_month: number | null
  currency: string
  images: string[]
  amenities: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

interface AccommodationManagerProps {
  gymId: string
  currency: string
}

export function AccommodationManager({ gymId, currency }: AccommodationManagerProps) {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCsvModal, setShowCsvModal] = useState(false)
  const [csvData, setCsvData] = useState('')
  
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [roomType, setRoomType] = useState<'private' | 'shared' | 'dorm' | ''>('')
  const [capacity, setCapacity] = useState('')
  const [pricePerDay, setPricePerDay] = useState('')
  const [pricePerWeek, setPricePerWeek] = useState('')
  const [pricePerMonth, setPricePerMonth] = useState('')
  const [accommodationCurrency, setAccommodationCurrency] = useState(currency)
  const [images, setImages] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [isActive, setIsActive] = useState(true)
  
  // Amenities
  const [amenities, setAmenities] = useState({
    ac: false,
    fan: false,
    wifi: false,
    bathroom: 'shared', // 'private', 'shared', 'none'
    hot_water: false,
    balcony: false,
    window: false,
  })
  
  useEffect(() => {
    fetchAccommodations()
  }, [gymId])
  
  const fetchAccommodations = async () => {
    if (!gymId) return
    
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('accommodations')
      .select('*')
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching accommodations:', error)
      alert('Failed to load accommodations')
    } else {
      setAccommodations(data || [])
    }
    setLoading(false)
  }
  
  const resetForm = () => {
    setName('')
    setDescription('')
    setRoomType('')
    setCapacity('')
    setPricePerDay('')
    setPricePerWeek('')
    setPricePerMonth('')
    setAccommodationCurrency(currency)
    setImages([])
    setExistingImages([])
    setIsActive(true)
    setAmenities({
      ac: false,
      fan: false,
      wifi: false,
      bathroom: 'shared',
      hot_water: false,
      balcony: false,
      window: false,
    })
    setEditingId(null)
  }
  
  const handleEdit = (acc: Accommodation) => {
    setEditingId(acc.id)
    setName(acc.name)
    setDescription(acc.description || '')
    setRoomType(acc.room_type || '')
    setCapacity(acc.capacity?.toString() || '')
    setPricePerDay(acc.price_per_day?.toString() || '')
    setPricePerWeek(acc.price_per_week?.toString() || '')
    setPricePerMonth(acc.price_per_month?.toString() || '')
    setAccommodationCurrency(acc.currency || currency)
    setExistingImages(acc.images || [])
    setImages([])
    setIsActive(acc.is_active)
    const defaultAmenities = {
      ac: false,
      fan: false,
      wifi: false,
      bathroom: 'shared',
      hot_water: false,
      balcony: false,
      window: false,
    }
    setAmenities({
      ...defaultAmenities,
      ...(acc.amenities || {}),
      bathroom: acc.amenities?.bathroom || 'shared',
    })
    setShowModal(true)
  }
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    setImages(prev => [...prev, ...files].slice(0, 10)) // Max 10 images
  }
  
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }
  
  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index))
  }
  
  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a room name')
      return
    }
    
    if (!pricePerDay && !pricePerWeek && !pricePerMonth) {
      alert('Please enter at least one price')
      return
    }
    
    const supabase = createClient()
    
    // Upload new images
    let uploadedImageUrls: string[] = []
    if (images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const image = images[i]
        try {
          const fileExt = image.name.split('.').pop()
          const fileName = `accommodations/${gymId}/${Date.now()}-${i}.${fileExt}`
          const { error: uploadError } = await supabase.storage
            .from('gym-images')
            .upload(fileName, image)
          
          if (uploadError) throw uploadError
          
          const { data } = supabase.storage
            .from('gym-images')
            .getPublicUrl(fileName)
          
          uploadedImageUrls.push(data.publicUrl)
        } catch (error) {
          console.error('Failed to upload image:', error)
        }
      }
    }
    
    const allImages = [...existingImages, ...uploadedImageUrls]
    
    const payload: any = {
      gym_id: gymId,
      name,
      description: description || null,
      room_type: roomType || null,
      capacity: capacity ? parseInt(capacity) : null,
      price_per_day: pricePerDay ? parseFloat(pricePerDay) : null,
      price_per_week: pricePerWeek ? parseFloat(pricePerWeek) : null,
      price_per_month: pricePerMonth ? parseFloat(pricePerMonth) : null,
      currency: accommodationCurrency,
      images: allImages,
      amenities,
      is_active: isActive,
    }
    
    try {
      if (editingId) {
        const { error } = await supabase
          .from('accommodations')
          .update(payload)
          .eq('id', editingId)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('accommodations')
          .insert(payload)
          .select()
          .single()
        
        if (error) throw error
      }
      
      fetchAccommodations()
      resetForm()
      setShowModal(false)
    } catch (error: any) {
      alert(`Failed to save: ${error.message}`)
    }
  }
  
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this accommodation? It will be removed from all linked packages.')) {
      return
    }
    
    const supabase = createClient()
    const { error } = await supabase
      .from('accommodations')
      .delete()
      .eq('id', id)
    
    if (error) {
      alert(`Failed to delete: ${error.message}`)
    } else {
      fetchAccommodations()
    }
  }
  
  const handleCsvImport = async () => {
    if (!csvData.trim()) {
      alert('Please paste CSV data')
      return
    }
    
    const lines = csvData.trim().split('\n')
    if (lines.length < 2) {
      alert('CSV must have at least a header row and one data row')
      return
    }
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const requiredHeaders = ['name', 'room_type', 'price_per_week']
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
    
    if (missingHeaders.length > 0) {
      alert(`Missing required columns: ${missingHeaders.join(', ')}`)
      return
    }
    
    const supabase = createClient()
    const accommodationsToInsert: any[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const row: any = { gym_id: gymId, currency: accommodationCurrency, images: [], amenities: {}, is_active: true }
      
      headers.forEach((header, idx) => {
        const value = values[idx] || ''
        switch (header) {
          case 'name':
            row.name = value
            break
          case 'description':
            row.description = value || null
            break
          case 'room_type':
            row.room_type = value || null
            break
          case 'capacity':
            row.capacity = value ? parseInt(value) : null
            break
          case 'price_per_day':
            row.price_per_day = value ? parseFloat(value) : null
            break
          case 'price_per_week':
            row.price_per_week = value ? parseFloat(value) : null
            break
          case 'price_per_month':
            row.price_per_month = value ? parseFloat(value) : null
            break
          case 'currency':
            row.currency = value || accommodationCurrency
            break
        }
      })
      
      if (row.name) {
        accommodationsToInsert.push(row)
      }
    }
    
    if (accommodationsToInsert.length === 0) {
      alert('No valid accommodations found in CSV')
      return
    }
    
    try {
      const { error } = await supabase
        .from('accommodations')
        .insert(accommodationsToInsert)
      
      if (error) throw error
      
      alert(`Successfully imported ${accommodationsToInsert.length} accommodation(s)`)
      setShowCsvModal(false)
      setCsvData('')
      fetchAccommodations()
    } catch (error: any) {
      alert(`Failed to import: ${error.message}`)
    }
  }
  
  const exportCsv = () => {
    const headers = ['name', 'description', 'room_type', 'capacity', 'price_per_day', 'price_per_week', 'price_per_month', 'currency']
    const rows = accommodations.map(acc => [
      acc.name,
      acc.description || '',
      acc.room_type || '',
      acc.capacity || '',
      acc.price_per_day || '',
      acc.price_per_week || '',
      acc.price_per_month || '',
      acc.currency,
    ])
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `accommodations-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BedDouble className="w-5 h-5" />
            Accommodation Manager
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage your room types independently. These can be linked to multiple packages.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCsvModal(true)}
          >
            <Upload className="w-4 h-4 mr-1" />
            Import CSV
          </Button>
          {accommodations.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportCsv}
            >
              <Download className="w-4 h-4 mr-1" />
              Export CSV
            </Button>
          )}
          <Button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="bg-[#003580] hover:bg-[#003580]/90"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Accommodation
          </Button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading accommodations...</p>
        </div>
      ) : accommodations.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BedDouble className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="font-semibold mb-2">No accommodations yet</h4>
            <p className="text-sm text-gray-600 mb-4">
              Create your first room type to get started. You can link these to packages later.
            </p>
            <Button
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
              className="bg-[#003580] hover:bg-[#003580]/90"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Accommodation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {accommodations.map(acc => (
            <Card key={acc.id} className={!acc.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Image Preview */}
                  <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    {acc.images && acc.images.length > 0 ? (
                      <img
                        src={acc.images[0]}
                        alt={acc.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BedDouble className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    {acc.images && acc.images.length > 1 && (
                      <div className="absolute bottom-0 right-0 bg-[#003580] text-white text-[10px] px-1.5 py-0.5 rounded-tl">
                        +{acc.images.length - 1}
                      </div>
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-lg">{acc.name}</h4>
                        {acc.room_type && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded mt-1 inline-block">
                            {ROOM_TYPES.find(rt => rt.value === acc.room_type)?.label || acc.room_type}
                          </span>
                        )}
                        {!acc.is_active && (
                          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded mt-1 ml-2 inline-block">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(acc)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(acc.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    
                    {acc.description && (
                      <p className="text-sm text-gray-600 mb-2">{acc.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm">
                      {acc.price_per_week && (
                        <div>
                          <span className="text-gray-600">Week: </span>
                          <span className="font-semibold text-[#003580]">
                            {acc.currency} {acc.price_per_week.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {acc.price_per_month && (
                        <div>
                          <span className="text-gray-600">Month: </span>
                          <span className="font-semibold text-[#003580]">
                            {acc.currency} {acc.price_per_month.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {acc.capacity && (
                        <div>
                          <span className="text-gray-600">Capacity: </span>
                          <span className="font-medium">{acc.capacity} person{acc.capacity > 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                    
                    {acc.images && acc.images.length > 0 && (
                      <div className="text-xs text-gray-500 mt-2">
                        {acc.images.length} {acc.images.length === 1 ? 'image' : 'images'}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Accommodation' : 'Add New Accommodation'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Room Name *</Label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Standard Fan Room"
                  required
                />
              </div>
              <div>
                <Label>Room Type</Label>
                <Select
                  value={roomType}
                  onChange={e => setRoomType(e.target.value as any)}
                >
                  <option value="">Select type</option>
                  {ROOM_TYPES.map(rt => (
                    <option key={rt.value} value={rt.value}>{rt.label}</option>
                  ))}
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the room, amenities, and what guests can expect..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Capacity (people)</Label>
                <Input
                  type="number"
                  value={capacity}
                  onChange={e => setCapacity(e.target.value)}
                  placeholder="1"
                />
              </div>
              <div>
                <Label>Currency</Label>
                <Select
                  value={accommodationCurrency}
                  onChange={e => setAccommodationCurrency(e.target.value)}
                >
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={isActive ? 'active' : 'inactive'}
                  onChange={e => setIsActive(e.target.value === 'active')}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </div>
            </div>
            
            <div>
              <Label className="mb-3 block">Pricing</Label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-gray-600">Per Day</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={pricePerDay}
                    onChange={e => setPricePerDay(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Per Week</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={pricePerWeek}
                    onChange={e => setPricePerWeek(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Per Month</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={pricePerMonth}
                    onChange={e => setPricePerMonth(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Enter at least one price. Guests will see the best rate for their duration.
              </p>
            </div>
            
            <div>
              <Label className="mb-3 block">Amenities</Label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={amenities.ac}
                    onChange={e => setAmenities({...amenities, ac: e.target.checked})}
                    className="rounded"
                  />
                  <span className="text-sm">Air Conditioning</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={amenities.fan}
                    onChange={e => setAmenities({...amenities, fan: e.target.checked})}
                    className="rounded"
                  />
                  <span className="text-sm">Fan</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={amenities.wifi}
                    onChange={e => setAmenities({...amenities, wifi: e.target.checked})}
                    className="rounded"
                  />
                  <span className="text-sm">WiFi</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={amenities.hot_water}
                    onChange={e => setAmenities({...amenities, hot_water: e.target.checked})}
                    className="rounded"
                  />
                  <span className="text-sm">Hot Water</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={amenities.balcony}
                    onChange={e => setAmenities({...amenities, balcony: e.target.checked})}
                    className="rounded"
                  />
                  <span className="text-sm">Balcony</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={amenities.window}
                    onChange={e => setAmenities({...amenities, window: e.target.checked})}
                    className="rounded"
                  />
                  <span className="text-sm">Window</span>
                </label>
              </div>
              <div className="mt-3">
                <Label className="text-sm mb-2 block">Bathroom</Label>
                <Select
                  value={amenities.bathroom}
                  onChange={e => setAmenities({...amenities, bathroom: e.target.value})}
                >
                  <option value="private">Private</option>
                  <option value="shared">Shared</option>
                  <option value="none">None</option>
                </Select>
              </div>
            </div>
            
            <div>
              <Label className="mb-3 block">Images (up to 10)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="accommodation-images"
                />
                <label
                  htmlFor="accommodation-images"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    Click to upload images
                  </span>
                  <span className="text-xs text-gray-500">
                    PNG, JPG up to 5MB each
                  </span>
                </label>
              </div>
              
              {/* Image Previews */}
              {(existingImages.length > 0 || images.length > 0) && (
                <div className="grid grid-cols-4 gap-3 mt-4">
                  {existingImages.map((img, idx) => (
                    <div key={`existing-${idx}`} className="relative group">
                      <img
                        src={img}
                        alt={`Existing ${idx + 1}`}
                        className="w-full aspect-video object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {images.map((img, idx) => (
                    <div key={`new-${idx}`} className="relative group">
                      <img
                        src={URL.createObjectURL(img)}
                        alt={`New ${idx + 1}`}
                        className="w-full aspect-video object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => {
                setShowModal(false)
                resetForm()
              }}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-[#003580] hover:bg-[#003580]/90">
                {editingId ? 'Update' : 'Create'} Accommodation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* CSV Import Modal */}
      <Dialog open={showCsvModal} onOpenChange={setShowCsvModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Accommodations from CSV</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-900 mb-2">CSV Format Required:</p>
                  <p className="text-blue-800 mb-2">Required columns: <code className="bg-blue-100 px-1 rounded">name</code>, <code className="bg-blue-100 px-1 rounded">room_type</code>, <code className="bg-blue-100 px-1 rounded">price_per_week</code></p>
                  <p className="text-blue-800 mb-2">Optional columns: <code className="bg-blue-100 px-1 rounded">description</code>, <code className="bg-blue-100 px-1 rounded">capacity</code>, <code className="bg-blue-100 px-1 rounded">price_per_day</code>, <code className="bg-blue-100 px-1 rounded">price_per_month</code>, <code className="bg-blue-100 px-1 rounded">currency</code></p>
                  <p className="text-blue-800 text-xs mt-2">Example:</p>
                  <pre className="bg-blue-100 p-2 rounded text-xs mt-1 overflow-x-auto">
{`name,room_type,price_per_week,capacity,description
Standard Fan Room,shared,2000,4,Shared room with fan
Private AC Room,private,5000,2,Private room with AC`}
                  </pre>
                </div>
              </div>
            </div>
            
            <div>
              <Label>Paste CSV Data</Label>
              <Textarea
                value={csvData}
                onChange={e => setCsvData(e.target.value)}
                placeholder="Paste your CSV data here..."
                rows={10}
                className="font-mono text-sm"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowCsvModal(false)
                setCsvData('')
              }}>
                Cancel
              </Button>
              <Button onClick={handleCsvImport} className="bg-[#003580] hover:bg-[#003580]/90">
                Import Accommodations
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
