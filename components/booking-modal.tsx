'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import type { Gym } from '@/lib/types/database'
import { differenceInDays } from 'date-fns'
import { calculateEstimatedPrice } from '@/lib/utils'

const DISCIPLINES = ['Muay Thai', 'MMA', 'BJJ', 'Boxing', 'Wrestling', 'Kickboxing']
const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'] as const

interface BookingModalProps {
  gym: Gym
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: {
    checkin: string
    checkout: string
    packageId?: string
    packageVariantId?: string
    packageName?: string
    variantName?: string
    includeAccommodation?: boolean
    includeMeals?: boolean
    estimatedPrice: number
  }
}

export function BookingModal({ gym, open, onOpenChange, initialData }: BookingModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [bookingData, setBookingData] = useState({
    start_date: initialData?.checkin || '',
    end_date: initialData?.checkout || '',
    discipline: '',
    experience_level: 'beginner' as const,
    notes: '',
    packageId: initialData?.packageId || '',
    includeAccommodation: initialData?.includeAccommodation || false,
    includeMeals: initialData?.includeMeals || false,
  })

  // Update state when initialData changes
  useEffect(() => {
    if (initialData) {
      setBookingData(prev => ({
        ...prev,
        start_date: initialData.checkin,
        end_date: initialData.checkout,
        packageId: initialData.packageId || '',
        includeAccommodation: initialData.includeAccommodation || false,
        includeMeals: initialData.includeMeals || false,
      }))
    }
  }, [initialData])

  const calculateTotal = () => {
     // If coming from package selection, trust the passed estimated price for now 
     // (or recalculate if we had full package object here, but we simplify)
     if (initialData?.estimatedPrice) return initialData.estimatedPrice
     
     // Fallback to gym base price if no package (shouldn't happen in new flow)
     if (!bookingData.start_date || !bookingData.end_date) return 0
     const days = differenceInDays(new Date(bookingData.end_date), new Date(bookingData.start_date))
     return days * gym.price_per_day
  }

  const handleSubmit = async () => {
    setError(null)
    setLoading(true)

    try {
      const total = calculateTotal()
      const platformFee = total * 0.15 // 15% commission
      
      // Append options to notes
      let finalNotes = bookingData.notes
      if (initialData?.variantName) finalNotes = `[Variant: ${initialData.variantName}]\n` + finalNotes
      if (initialData?.packageName) finalNotes = `[Package: ${initialData.packageName}]\n` + finalNotes
      if (bookingData.includeAccommodation) finalNotes += '\n[Includes Accommodation]'
      if (bookingData.includeMeals) finalNotes += '\n[Includes Meal Plan]'
      
      // Create booking request
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gym_id: gym.id,
          package_id: bookingData.packageId || null,
          package_variant_id: initialData?.packageVariantId || null,
          start_date: bookingData.start_date,
          end_date: bookingData.end_date,
          discipline: bookingData.discipline,
          experience_level: bookingData.experience_level,
          notes: finalNotes,
          total_price: total,
          platform_fee: platformFee,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking')
      }

      // Redirect to payment
      router.push(`/bookings/${data.booking_id}/payment`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request to Book</DialogTitle>
          <DialogDescription>
            {gym.name} - {gym.city}, {gym.country}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Check-in Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={bookingData.start_date}
                onChange={(e) => setBookingData(prev => ({ ...prev, start_date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Check-out Date *</Label>
              <Input
                id="end_date"
                type="date"
                value={bookingData.end_date}
                onChange={(e) => setBookingData(prev => ({ ...prev, end_date: e.target.value }))}
                min={bookingData.start_date || new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discipline">Discipline *</Label>
              <Select
                id="discipline"
                value={bookingData.discipline}
                onChange={(e) => setBookingData(prev => ({ ...prev, discipline: e.target.value }))}
                required
              >
                <option value="">Select discipline</option>
                {DISCIPLINES.filter(d => gym.disciplines.includes(d)).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience_level">Experience Level *</Label>
              <Select
                id="experience_level"
                value={bookingData.experience_level}
                onChange={(e) => setBookingData(prev => ({ ...prev, experience_level: e.target.value as any }))}
                required
              >
                {EXPERIENCE_LEVELS.map(level => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (optional)</Label>
            <Textarea
              id="notes"
              value={bookingData.notes}
              onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="Any special requests or information..."
            />
          </div>

          {bookingData.start_date && bookingData.end_date && (
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Duration</span>
                <span>{differenceInDays(new Date(bookingData.end_date), new Date(bookingData.start_date))} days</span>
              </div>
              
              {initialData?.packageName && (
                <div className="flex justify-between text-sm font-medium text-gray-900 bg-gray-50 p-2 rounded">
                  <span>Package</span>
                  <span>{initialData.packageName}</span>
                </div>
              )}

              <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                <span>Estimated Total</span>
                <span>{calculateTotal().toFixed(2)} {gym.currency}</span>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Final price confirmed by gym
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !bookingData.start_date || !bookingData.end_date || !bookingData.discipline}
              className="flex-1"
            >
              {loading ? 'Processing...' : 'Continue to Payment'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
