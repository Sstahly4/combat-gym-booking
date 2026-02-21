'use client'

import { useState, useRef, type MouseEvent, type TouchEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useBooking } from '@/lib/contexts/booking-context'
import { useCurrency } from '@/lib/contexts/currency-context'
import { calculatePackagePrice } from '@/lib/utils'
import type { Package, Gym, PackageVariant, GymImage } from '@/lib/types/database'
import { Check, BedDouble, ChevronLeft, ChevronRight, Home, Wifi, Car, Droplets, UtensilsCrossed, Users, Shield, Clock, Building2, Dumbbell, Thermometer, Waves, X } from 'lucide-react'
import Image from 'next/image'

export function PackagesList({ packages, gym }: { packages: Package[], gym: Gym & { images?: GymImage[] } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { selectedPackage, setSelectedPackage, checkin, checkout, setCheckin, setCheckout } = useBooking()
  const { convertPrice, formatPrice } = useCurrency()
  const [variantsModalOpen, setVariantsModalOpen] = useState(false)
  const [activePackage, setActivePackage] = useState<Package | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState<Record<string, number>>({})
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({})

  // Swipe logic for mobile bottom sheet
  const [sheetTranslateY, setSheetTranslateY] = useState(0)
  const sheetStartY = useRef(0)
  const sheetIsDragging = useRef(false)

  const handleSheetTouchStart = (e: TouchEvent) => {
    sheetStartY.current = e.touches[0].clientY
    sheetIsDragging.current = true
  }

  const handleSheetTouchMove = (e: TouchEvent) => {
    if (!sheetIsDragging.current) return
    const currentY = e.touches[0].clientY
    const diffY = currentY - sheetStartY.current
    // Only allow dragging down
    if (diffY > 0) {
      setSheetTranslateY(diffY)
    }
  }

  const handleSheetTouchEnd = () => {
    if (!sheetIsDragging.current) return
    sheetIsDragging.current = false
    if (sheetTranslateY > 100) { // Threshold to close
      setVariantsModalOpen(false)
    }
    setSheetTranslateY(0)
  }
  
  // Check if dates are user-provided (from URL params) or auto-defaulted
  const hasUserSelectedDates = searchParams.get('checkin') && searchParams.get('checkout')
  
  const duration = (checkin && checkout) 
    ? Math.floor((new Date(checkout).getTime() - new Date(checkin).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const nextImage = (variantId: string, total: number, e: MouseEvent) => {
    e.stopPropagation()
    setActiveImageIndex(prev => ({
      ...prev,
      [variantId]: ((prev[variantId] ?? 0) + 1) % total,
    }))
  }

  const prevImage = (variantId: string, total: number, e: MouseEvent) => {
    e.stopPropagation()
    setActiveImageIndex(prev => ({
      ...prev,
      [variantId]: ((prev[variantId] ?? 0) - 1 + total) % total,
    }))
  }

  const isValidDuration = duration > 0
  // Pricing vs display duration:
  // - We compute `duration` as nights (checkout - checkin).
  // - For training + all-inclusive we price by "days", which is nights + 1 (camp convention).
  // - Accommodation stays priced/displayed off nights.
  const getPricingDuration = (packageType: Package['type']) => {
    if (!isValidDuration) return duration
    return (packageType === 'training' || packageType === 'all_inclusive') ? (duration + 1) : duration
  }

  // Extend stay handler — sets checkout to checkin + minStay days
  const handleExtendStay = (minStayDays: number) => {
    if (!checkin) return
    const start = new Date(checkin)
    const newCheckout = new Date(start.getTime() + minStayDays * 24 * 60 * 60 * 1000)
    setCheckout(newCheckout.toISOString().split('T')[0])
    // Close variant modal if open so user sees updated dates
    setVariantsModalOpen(false)
  }

  const handleSelectPackage = (pkg: Package) => {
    // If package has variants, open modal instead of selecting directly
    if (pkg.variants && pkg.variants.length > 0) {
      setActivePackage(pkg)
      setVariantsModalOpen(true)
    } else {
      // Training-only packages: navigate directly to summary
      setSelectedPackage(pkg)
      
      // For Training Only packages, default to 1 day if dates are not set or are at default 7-day range
      let finalCheckin = checkin
      let finalCheckout = checkout
      
      if (pkg.type === 'training') {
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(today.getDate() + 1)
        
        // If no dates set, set to 1 day (today to tomorrow)
        if (!checkin || !checkout) {
          finalCheckin = today.toISOString().split('T')[0]
          finalCheckout = tomorrow.toISOString().split('T')[0]
          setCheckin(finalCheckin)
          setCheckout(finalCheckout)
        } else {
          const currentDuration = Math.floor((new Date(checkout).getTime() - new Date(checkin).getTime()) / (1000 * 60 * 60 * 24))
          // If duration is 7 days (likely default), change to 1 day
          if (currentDuration === 7) {
            finalCheckout = new Date(new Date(checkin).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            setCheckout(finalCheckout)
          }
        }
      }
      
      const params = new URLSearchParams({
        gymId: gym.id,
        packageId: pkg.id,
        checkin: finalCheckin || '',
        checkout: finalCheckout || '',
      })
      router.push(`/bookings/summary?${params.toString()}`)
    }
  }

  const handleSelectVariant = (pkg: Package, variant: PackageVariant) => {
    // Construct a "virtual" package that combines the base package info with variant pricing/name
    const variantPackage = {
      ...pkg,
      id: pkg.id, // Keep original ID for backend but maybe we need to pass variant_id separately
      name: `${pkg.name} - ${variant.name}`,
      price_per_day: variant.price_per_day,
      price_per_week: variant.price_per_week,
      price_per_month: variant.price_per_month,
      accommodation_name: variant.name,
      // Store the actual variant ID for booking context if needed (we might need to update context type)
    } as Package & { variant_id?: string; variant_name?: string }
    
    // We need to pass the variant ID to the context/booking modal
    // For now, let's attach it as a custom property that our context/modal can read
    // This is a bit of a hack, ideally we update the context type
    variantPackage.variant_id = variant.id
    variantPackage.variant_name = variant.name
    
    setSelectedPackage(variantPackage)
    setVariantsModalOpen(false)
    
    // Navigate to booking summary page (Booking.com style)
    // Pass gym ID, package, variant, and dates as URL params
    const params = new URLSearchParams({
      gymId: gym.id,
      packageId: pkg.id,
      variantId: variant.id,
      checkin: checkin || '',
      checkout: checkout || '',
    })
    router.push(`/bookings/summary?${params.toString()}`)
  }

  // Sort packages: Training Only first, then others
  const sortedPackages = [...packages].sort((a, b) => {
    if (a.type === 'training' && b.type !== 'training') return -1
    if (a.type !== 'training' && b.type === 'training') return 1
    return 0
  })

  return (
    <div className="space-y-4">
      {packages.length === 0 ? (
         <div className="p-6 bg-gray-50 rounded-lg text-center text-muted-foreground">
            No packages available for this gym yet. 
            <br />
            Please contact us directly for booking inquiries.
         </div>
      ) : (
        <div className="grid gap-4">
          {sortedPackages.map(pkg => {
            // Get base prices (for legacy packages) or use new pricing structure
            let basePrices = {
              daily: pkg.price_per_day,
              weekly: pkg.price_per_week,
              monthly: pkg.price_per_month
            }

            // If variants exist, use the cheapest one for "starting from"
            // Always fall back to base package prices if the variant field is null
            if (pkg.variants && pkg.variants.length > 0) {
              const getComparePrice = (v: PackageVariant) => {
                if (pkg.type === 'training') return v.price_per_day ?? pkg.price_per_day ?? Infinity
                return v.price_per_week ?? pkg.price_per_week ?? v.price_per_month ?? pkg.price_per_month ?? Infinity
              }
              const cheapest = pkg.variants.reduce((prev, curr) => {
                return getComparePrice(curr) < getComparePrice(prev) ? curr : prev
              })
              basePrices = {
                daily: cheapest.price_per_day ?? pkg.price_per_day,
                weekly: cheapest.price_per_week ?? pkg.price_per_week,
                monthly: cheapest.price_per_month ?? pkg.price_per_month
              }
            }

            // Ghost state: check if min stay is met
            const minStay = pkg.min_stay_days ?? (pkg.type === 'training' ? 1 : 7)
            const meetsMinStay = !isValidDuration || duration >= minStay
            const nightsToUnlock = isValidDuration ? Math.max(0, minStay - duration) : 0
            const isGhosted = isValidDuration && !meetsMinStay

            // Compute anchor price for ghost state — try weekly → monthly → daily, never $0
            const anchorPrice = basePrices.weekly || basePrices.monthly || basePrices.daily || 0
            const anchorLabel = basePrices.weekly ? 'week' : basePrices.monthly ? 'month' : 'day'

            // Calculate price based on package type and billing units
            // For Training Only: if dates are NOT user-selected (auto-defaulted), show per day pricing
            // Otherwise, calculate based on actual duration
            const shouldShowPerSession = pkg.type === 'training' && !hasUserSelectedDates
            
            const priceInfo = (isValidDuration && !shouldShowPerSession)
              ? calculatePackagePrice(getPricingDuration(pkg.type), pkg.type, basePrices)
              : {
                  price: pkg.type === 'training' 
                    ? (basePrices.daily || 0)
                    : (basePrices.weekly || 0),
                  unit: pkg.type === 'training' ? 'day' as const : 'week' as const,
                  duration: pkg.type === 'training' ? 1 : 0,
                  durationLabel: pkg.type === 'training' ? '1 day' : ''
                }

            // Display "days" for training/all-inclusive as nights + 1 (to match pricing),
            // otherwise keep using nights-based duration.
            const displayedDays =
              (pkg.type === 'training' || pkg.type === 'all_inclusive') ? getPricingDuration(pkg.type) : duration

            const isSelected = selectedPackage?.id === pkg.id && !selectedPackage.name.includes(' - ') // Simple check if base package selected

            // Get package image - use package image if available, otherwise fallback to gym's first image
            const packageImage = pkg.image || (gym.images && gym.images.length > 0 ? gym.images[0].url : null)

            // Get facility icons for mobile display
            const getFacilityIcon = (key: string) => {
              const iconMap: Record<string, JSX.Element> = {
                wifi: <Wifi className="w-3.5 h-3.5 text-gray-600" />,
                accommodation: <Building2 className="w-3.5 h-3.5 text-gray-600" />,
                meals: <UtensilsCrossed className="w-3.5 h-3.5 text-gray-600" />,
                air_conditioning: <Thermometer className="w-3.5 h-3.5 text-gray-600" />,
                swimming_pool: <Waves className="w-3.5 h-3.5 text-gray-600" />,
                parking: <Car className="w-3.5 h-3.5 text-gray-600" />,
                showers: <Droplets className="w-3.5 h-3.5 text-gray-600" />,
              }
              return iconMap[key] || <Check className="w-3.5 h-3.5 text-gray-600" />
            }

            // Get active amenities for mobile display (limit to 4-5 most relevant)
            const activeAmenities = Object.entries(gym.amenities || {})
              .filter(([_, value]) => value)
              .slice(0, 5)
              .map(([key]) => key)

            return (
              <Card 
                key={pkg.id} 
                className={`transition-all border-2 overflow-hidden ${
                  isGhosted 
                    ? 'border-gray-200 bg-gray-50/50 opacity-80' 
                    : isSelected 
                      ? 'border-[#003580] bg-blue-50/20 shadow-lg cursor-pointer hover:shadow-xl' 
                      : 'border-gray-200 hover:border-[#003580]/50 bg-white cursor-pointer hover:shadow-xl'
                }`}
              >
                <CardContent className="p-0">
                  {/* Mobile Layout - Compact Booking.com Style */}
                  <div className="md:hidden p-4">
                    <div className="flex gap-3 mb-3">
                      {/* Left: Title and Description */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-gray-900 mb-1.5 line-clamp-1">{pkg.name}</h3>
                        {pkg.description && (
                          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-2">
                            {pkg.description}
                          </p>
                        )}
                        
                        {/* Facility Icons - Small icons row */}
                        <div className="flex flex-wrap gap-2 mb-2">
                          {pkg.includes_accommodation && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Building2 className="w-3.5 h-3.5" />
                              <span>Accommodation</span>
                            </div>
                          )}
                          {pkg.includes_meals && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <UtensilsCrossed className="w-3.5 h-3.5" />
                              <span>Meals</span>
                            </div>
                          )}
                          {activeAmenities.slice(0, 3).map((amenity) => (
                            <div key={amenity} className="flex items-center gap-1 text-xs text-gray-600">
                              {getFacilityIcon(amenity)}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Right: Small Image */}
                      <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                        {packageImage ? (
                          <Image
                            src={packageImage}
                            alt={pkg.name}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                            <Home className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Bottom: Price and Button */}
                    <div className="border-t border-gray-200 pt-3 mt-3">
                      {isGhosted ? (
                        /* Ghost State — Mobile */
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-bold text-gray-500 mt-1">
                              From {formatPrice(convertPrice(anchorPrice, gym.currency))}
                              <span className="text-[10px] font-normal text-gray-400 ml-1">/ {anchorLabel}</span>
                            </div>
                          </div>
                          <Button 
                            variant="outline"
                            className="min-w-[100px] h-9 font-semibold text-xs border-2 border-[#003580] text-[#003580] hover:bg-[#003580] hover:text-white"
                            onClick={() => handleExtendStay(minStay)}
                          >
                            Extend {nightsToUnlock} {nightsToUnlock === 1 ? 'day' : 'days'}
                          </Button>
                        </div>
                      ) : (
                        /* Normal State — Mobile */
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-[10px] text-gray-500 mb-0.5">
                            {pkg.variants?.length ? 'From' : 'Price for'} {isValidDuration ? `${displayedDays} ${displayedDays === 1 ? 'day' : 'days'}` : (pkg.type === 'training' ? '1 day' : '1 week')}
                          </div>
                          <div className="text-lg font-bold text-[#003580]">
                            {formatPrice(convertPrice(priceInfo.price, gym.currency))}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            Includes taxes and charges
                          </div>
                        </div>
                        <Button 
                          variant={isSelected ? "default" : "outline"}
                          className={`min-w-[100px] h-9 font-semibold text-xs ${
                            isSelected 
                              ? 'bg-[#003580] hover:bg-[#003580]/90 text-white shadow-md' 
                              : 'border-2 border-[#003580] text-[#003580] hover:bg-[#003580] hover:text-white'
                          }`}
                          onClick={() => handleSelectPackage(pkg)}
                        >
                          {isSelected ? 'Selected' : (pkg.variants?.length ? 'Choose' : 'Reserve')}
                        </Button>
                      </div>
                      )}
                    </div>
                  </div>

                  {/* Desktop Layout - Unchanged */}
                  <div className="hidden md:flex flex-col lg:flex-row">
                    {/* Image Section - Left Side */}
                    <div className="w-full lg:w-64 h-48 lg:h-auto flex-shrink-0 bg-gray-100 relative overflow-hidden">
                      {packageImage ? (
                        <img 
                          src={packageImage} 
                          alt={pkg.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          <Home className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Content Section - Middle - Desktop only */}
                    <div className="hidden md:flex flex-1 p-4 md:p-6 flex-col justify-between">
                      <div className="space-y-2 md:space-y-3">
                        <div>
                          <h3 className="font-semibold text-base md:text-lg text-gray-900 mb-1.5 md:mb-2">{pkg.name}</h3>
                          {pkg.description && (
                            <div className="text-gray-600 text-sm md:text-[15px] leading-relaxed">
                              <p className={expandedDescriptions[pkg.id] ? '' : 'line-clamp-2'}>
                                {pkg.description}
                              </p>
                              {/* For packages with variants: "See more" opens modal */}
                              {pkg.variants && pkg.variants.length > 0 ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setActivePackage(pkg)
                                    setVariantsModalOpen(true)
                                  }}
                                  className="text-gray-600 font-medium text-xs md:text-sm mt-1 hover:underline"
                                >
                                  See more
                                </button>
                              ) : (
                                /* For training packages: "See more" expands inline */
                                expandedDescriptions[pkg.id] ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setExpandedDescriptions(prev => ({ ...prev, [pkg.id]: false }))
                                    }}
                                    className="text-gray-600 font-medium text-xs md:text-sm mt-1 hover:underline"
                                  >
                                    See less
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setExpandedDescriptions(prev => ({ ...prev, [pkg.id]: true }))
                                    }}
                                    className="text-gray-600 font-medium text-xs md:text-sm mt-1 hover:underline"
                                  >
                                    See more
                                  </button>
                                )
                              )}
                            </div>
                          )}
                      </div>
                      
                        {/* Plan Extras - Booking.com Style */}
                      <div className="flex flex-wrap gap-2 md:gap-4 pt-2">
                        {pkg.includes_accommodation && (
                            <div className="flex items-center gap-1.5 text-xs md:text-sm text-green-700 font-medium">
                              <Check className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                              <span>{pkg.variants?.length ? `${pkg.variants.length} Room Options` : 'Accommodation Included'}</span>
                          </div>
                        )}
                        {pkg.includes_meals && (
                            <div className="flex items-center gap-1.5 text-xs md:text-sm text-green-700 font-medium">
                              <Check className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                            <span>Meal Plan Included</span>
                          </div>
                        )}
                          </div>
                      </div>
                    </div>

                    {/* Pricing Section - Right Side - Desktop only */}
                    <div className={`hidden md:flex w-full lg:w-64 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-gray-200 p-4 md:p-6 flex-col justify-center items-center lg:items-end ${
                      isGhosted ? 'bg-gray-50' : 'bg-gray-50 lg:bg-white'
                    }`}>
                      <div className="w-full text-center lg:text-right">
                      {isGhosted ? (
                        /* Ghost State — Desktop */
                        <>
                          <div className="text-gray-500 text-xs mb-1 mt-2">Starts at</div>
                          <div className="text-xl font-bold text-gray-500 mb-1">
                            {formatPrice(convertPrice(anchorPrice, gym.currency))}
                          </div>
                          <div className="text-xs text-gray-400 mb-4">
                            / {anchorLabel}
                          </div>
                          <Button 
                            variant="outline"
                            className="w-full lg:w-auto min-w-[140px] md:min-w-[160px] h-11 md:h-12 font-semibold text-sm md:text-base border-2 border-[#003580] text-[#003580] hover:bg-[#003580] hover:text-white"
                            onClick={() => handleExtendStay(minStay)}
                          >
                            Extend {nightsToUnlock} {nightsToUnlock === 1 ? 'day' : 'days'}
                          </Button>
                        </>
                      ) : pkg.type === 'training' && shouldShowPerSession ? (
                        // Training Only with no user-selected dates: show per day
                        <>
                          <div className="text-[10px] md:text-xs text-gray-500 mb-1">Starting from</div>
                            <div className="text-2xl md:text-3xl font-bold text-[#003580] mb-1">
                            {formatPrice(convertPrice(priceInfo.price, gym.currency))}
                            </div>
                            <div className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
                              per day
                          </div>
                        </>
                      ) : isValidDuration ? (
                        // User has selected dates: show total for those dates
                        <>
                          <div className="text-[10px] md:text-xs text-gray-500 mb-1">
                            {pkg.variants?.length ? 'From' : 'Price for'} {priceInfo.durationLabel}
                            </div>
                            <div className="text-2xl md:text-3xl font-bold text-[#003580] mb-1">
                              {formatPrice(convertPrice(priceInfo.price, gym.currency))}
                            </div>
                            <div className="text-[10px] md:text-xs text-gray-500 mb-3 md:mb-4">
                              Total for {displayedDays} {displayedDays === 1 ? 'day' : 'days'}
                            </div>
                        </>
                      ) : (
                        // No dates selected (accommodation packages)
                        <>
                           <div className="text-[10px] md:text-xs text-gray-500 mb-1">Starting from</div>
                            <div className="text-2xl md:text-3xl font-bold text-[#003580] mb-1">
                            {formatPrice(convertPrice(priceInfo.price, gym.currency))}
                            </div>
                            <div className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
                              per {pkg.type === 'training' ? 'day' : 'week'}
                          </div>
                          {minStay > 1 && (
                              <div className="text-[10px] md:text-xs text-gray-500 mb-3 md:mb-4 font-medium">Min. stay: {minStay} days</div>
                          )}
                        </>
                      )}
                      
                      {!isGhosted && (
                      <Button 
                        variant={isSelected ? "default" : "outline"}
                          className={`w-full lg:w-auto min-w-[140px] md:min-w-[160px] h-11 md:h-12 font-semibold text-sm md:text-base ${
                          isSelected 
                              ? 'bg-[#003580] hover:bg-[#003580]/90 text-white shadow-md' 
                              : 'border-2 border-[#003580] text-[#003580] hover:bg-[#003580] hover:text-white'
                        }`}
                        onClick={() => handleSelectPackage(pkg)}
                      >
                          {isSelected ? 'Selected' : (pkg.variants?.length ? 'Choose Room' : 'Select Package')}
                      </Button>
                      )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ─── MOBILE: Slide-up bottom sheet (md:hidden) ───────────────────── */}
      {variantsModalOpen && (
        <div className="md:hidden">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close room selector"
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setVariantsModalOpen(false)}
          />

          {/* Sheet */}
          <div 
            className="fixed inset-x-0 bottom-0 z-50 animate-slide-up bg-white rounded-t-2xl shadow-2xl flex flex-col max-h-[85dvh] transition-transform duration-100 ease-out will-change-transform"
            style={{ transform: `translateY(${sheetTranslateY}px)` }}
          >
            {/* Draggable Header Section */}
            <div
              className="flex-shrink-0 touch-none"
              onTouchStart={handleSheetTouchStart}
              onTouchMove={handleSheetTouchMove}
              onTouchEnd={handleSheetTouchEnd}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-4 pt-2 pb-3 border-b border-gray-100 flex items-start justify-between gap-3 cursor-grab active:cursor-grabbing">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-[#003580] uppercase tracking-wide mb-0.5">Choose your room</p>
                  <h2 className="text-base font-bold text-gray-900 leading-tight line-clamp-1">{activePackage?.name}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setVariantsModalOpen(false)}
                  className="p-2 -mr-1 rounded-full hover:bg-gray-100 active:bg-gray-200 flex-shrink-0"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Scrollable variant list */}
            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-4 pb-6">
              {activePackage?.variants?.map(variant => {
                const modalMinStay = activePackage.min_stay_days ?? (activePackage.type === 'training' ? 1 : 7)
                const modalNightsToUnlock = isValidDuration ? Math.max(0, modalMinStay - duration) : 0
                const modalIsGhosted = isValidDuration && duration < modalMinStay

                const variantAnchorPrice =
                  variant.price_per_week ?? activePackage.price_per_week ??
                  variant.price_per_month ?? activePackage.price_per_month ??
                  variant.price_per_day ?? activePackage.price_per_day ?? 0
                const variantAnchorUnit =
                  (variant.price_per_week ?? activePackage.price_per_week) ? 'week' :
                  (variant.price_per_month ?? activePackage.price_per_month) ? 'month' : 'day'

                const variantPriceInfo = isValidDuration
                  ? calculatePackagePrice(getPricingDuration(activePackage.type), activePackage.type, {
                      daily: variant.price_per_day,
                      weekly: variant.price_per_week,
                      monthly: variant.price_per_month
                    })
                  : {
                      price: activePackage.type === 'training'
                        ? (variant.price_per_day || 0)
                        : (variant.price_per_week || 0),
                      unit: activePackage.type === 'training' ? 'day' as const : 'week' as const,
                      duration: 0,
                      durationLabel: ''
                    }

                const images = variant.images || []
                const currentImageIndex = (activeImageIndex && activeImageIndex[variant.id]) || 0

                const mobileAmenities = Object.entries(gym.amenities || {})
                  .filter(([key, value]) => value && ['wifi', 'air_conditioning', 'parking', 'showers'].includes(key))
                  .slice(0, 4)
                const amenityLabels: Record<string, string> = {
                  wifi: 'Free WiFi', air_conditioning: 'Air con',
                  parking: 'Parking', showers: 'Showers',
                }
                const amenityIcons: Record<string, JSX.Element> = {
                  wifi: <Wifi className="w-3.5 h-3.5" />,
                  air_conditioning: <Thermometer className="w-3.5 h-3.5" />,
                  parking: <Car className="w-3.5 h-3.5" />,
                  showers: <Droplets className="w-3.5 h-3.5" />,
                }

                return (
                  <div
                    key={variant.id}
                    className={`rounded-xl border overflow-hidden bg-white shadow-sm ${
                      modalIsGhosted ? 'border-gray-200 opacity-80' : 'border-gray-200'
                    }`}
                  >
                    {/* Variant image */}
                    {images.length > 0 ? (
                      <div className="relative h-44 bg-gray-100">
                        <img
                          src={images[currentImageIndex]}
                          alt={variant.name}
                          className="w-full h-full object-cover"
                        />
                        {images.length > 1 && (
                          <>
                            <button
                              onClick={(e) => prevImage(variant.id, images.length, e)}
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 text-gray-800 p-1.5 rounded-full shadow-md"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => nextImage(variant.id, images.length, e)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 text-gray-800 p-1.5 rounded-full shadow-md"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            {/* Image counter pill */}
                            <div className="absolute bottom-2 right-2 bg-gray-900/70 text-white text-[10px] font-medium px-2 py-0.5 rounded-md backdrop-blur-sm">
                              {currentImageIndex + 1} / {images.length}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="h-28 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <BedDouble className="w-10 h-10 text-gray-400" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-4">
                      {/* Variant name */}
                      <h3 className="font-bold text-[15px] text-gray-900 mb-1">{variant.name}</h3>

                      {/* Description */}
                      {variant.description && (
                        <p className="text-xs text-gray-600 leading-relaxed mb-3 line-clamp-2">
                          {variant.description}
                        </p>
                      )}

                      {/* Amenity chips */}
                      {mobileAmenities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {mobileAmenities.map(([key]) => (
                            <span key={key} className="flex items-center gap-1 text-[11px] text-gray-700 bg-gray-100 rounded-full px-2.5 py-1">
                              {amenityIcons[key]}
                              {amenityLabels[key] || key}
                            </span>
                          ))}
                          <span className="flex items-center gap-1 text-[11px] text-gray-700 bg-gray-100 rounded-full px-2.5 py-1">
                            <Check className="w-3.5 h-3.5 text-green-600" />
                            Private bathroom
                          </span>
                        </div>
                      )}

                      {/* Divider */}
                      <div className="border-t border-gray-100 pt-3 mt-1">
                        {modalIsGhosted ? (
                          /* Ghost state — mobile variant */
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[10px] text-gray-500 mb-0.5">Starts at</p>
                              <p className="text-base font-bold text-gray-500">
                                {formatPrice(convertPrice(variantAnchorPrice, gym.currency))}
                                <span className="text-[10px] font-normal text-gray-400 ml-1">/ {variantAnchorUnit}</span>
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              className="h-9 px-4 text-xs font-semibold border-2 border-[#003580] text-[#003580] hover:bg-[#003580] hover:text-white rounded-lg"
                              onClick={() => handleExtendStay(modalMinStay)}
                            >
                              Extend {modalNightsToUnlock} {modalNightsToUnlock === 1 ? 'day' : 'days'}
                            </Button>
                          </div>
                        ) : (
                          /* Normal state — mobile variant */
                          <>
                            <div className="flex items-end justify-between mb-3">
                              <div>
                                <p className="text-[10px] text-gray-500 mb-0.5">
                                  {isValidDuration ? `Total for ${variantPriceInfo.durationLabel}` : `Starting from`}
                                </p>
                                <p className="text-xl font-bold text-[#003580]">
                                  {formatPrice(convertPrice(variantPriceInfo.price, gym.currency))}
                                </p>
                                {!isValidDuration && (
                                  <p className="text-[10px] text-gray-500 mt-0.5">/ {variantAnchorUnit}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] text-green-600 font-medium">
                                  <Check className="w-3 h-3 inline mr-0.5" />
                                  Free cancellation
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Incl. taxes & fees</p>
                              </div>
                            </div>
                            <Button
                              className="w-full h-11 bg-[#003580] hover:bg-[#003580]/90 text-white font-bold text-sm rounded-lg"
                              onClick={() => activePackage && handleSelectVariant(activePackage, variant)}
                            >
                              Reserve this room
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── DESKTOP: Centered overlay (hidden on mobile) ───────────────────── */}
      {variantsModalOpen && (
      <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={() => setVariantsModalOpen(false)} />
        {/* Panel */}
        <div className="relative z-50 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-lg shadow-2xl mx-4">
          <div className="pb-4 border-b px-6 pt-6 flex-shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{activePackage?.name}</h2>
                <div className="text-base text-gray-600 mt-2">
              {activePackage?.description ? (
                <div>
                  <span className={expandedDescriptions[activePackage.id] ? '' : 'line-clamp-2'}>
                    {activePackage.description}
                  </span>
                  {activePackage.description.length > 150 && (
                    !expandedDescriptions[activePackage.id] ? (
                      <button
                        onClick={() => setExpandedDescriptions(prev => ({ ...prev, [activePackage.id]: true }))}
                        className="text-gray-600 font-medium text-sm mt-1 hover:underline ml-1"
                      >
                        See more
                      </button>
                    ) : (
                      <button
                        onClick={() => setExpandedDescriptions(prev => ({ ...prev, [activePackage.id]: false }))}
                        className="text-gray-600 font-medium text-sm mt-1 hover:underline ml-1"
                      >
                        See less
                      </button>
                    )
                  )}
                </div>
              ) : (
                'Choose a room type for your package.'
              )}
                </div>
              </div>
              <button
                onClick={() => setVariantsModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 flex-shrink-0 text-gray-500"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="grid gap-6">
            {activePackage?.variants?.map(variant => {
               // Ghost state for variant modal
               const modalMinStay = activePackage.min_stay_days ?? (activePackage.type === 'training' ? 1 : 7)
               const modalMeetsMinStay = !isValidDuration || duration >= modalMinStay
               const modalNightsToUnlock = isValidDuration ? Math.max(0, modalMinStay - duration) : 0
               const modalIsGhosted = isValidDuration && !modalMeetsMinStay

               const variantPriceInfo = isValidDuration 
                 ? calculatePackagePrice(getPricingDuration(activePackage.type), activePackage.type, {
                     daily: variant.price_per_day,
                     weekly: variant.price_per_week,
                     monthly: variant.price_per_month
                   })
                 : {
                     price: activePackage.type === 'training' 
                       ? (variant.price_per_day || 0)
                       : (variant.price_per_week || 0),
                     unit: activePackage.type === 'training' ? 'day' as const : 'week' as const,
                     duration: 0,
                     durationLabel: ''
                   }

               const images = variant.images || []
               const currentImageIndex = (activeImageIndex && activeImageIndex[variant.id]) || 0

                // Helper function to get amenity icon (same as gym page)
                const getAmenityIcon = (amenityKey: string) => {
                  const iconMap: Record<string, JSX.Element> = {
                    wifi: <Wifi className="w-4 h-4 text-gray-700" />,
                    parking: <Car className="w-4 h-4 text-gray-700" />,
                    showers: <Droplets className="w-4 h-4 text-gray-700" />,
                    accommodation: <Building2 className="w-4 h-4 text-gray-700" />,
                    equipment: <Dumbbell className="w-4 h-4 text-gray-700" />,
                    meals: <UtensilsCrossed className="w-4 h-4 text-gray-700" />,
                    locker_room: <Users className="w-4 h-4 text-gray-700" />,
                    security: <Shield className="w-4 h-4 text-gray-700" />,
                    air_conditioning: <Clock className="w-4 h-4 text-gray-700" />,
                  }
                  return iconMap[amenityKey] || <Check className="w-4 h-4 text-green-600" />
                }

                // Get relevant amenities for display
                const relevantAmenities = Object.entries(gym.amenities || {})
                  .filter(([key, value]) => value && ['wifi', 'air_conditioning', 'accommodation', 'parking', 'showers'].includes(key))
                  .slice(0, 8)

               return (
                  <div key={variant.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row">
                      {/* Image Gallery - Larger */}
                      <div className="w-full lg:w-80 h-64 lg:h-auto flex-shrink-0 bg-gray-100 relative group">
                    {images.length > 0 ? (
                      <>
                        <img 
                          src={images[currentImageIndex]} 
                          alt={variant.name}
                          className="w-full h-full object-cover"
                        />
                        {images.length > 1 && (
                          <>
                            <button 
                              onClick={(e) => prevImage(variant.id, images.length, e)}
                                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-md transition-opacity"
                            >
                                  <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={(e) => nextImage(variant.id, images.length, e)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-md transition-opacity"
                            >
                                  <ChevronRight className="w-5 h-5" />
                            </button>
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                              {images.map((_, idx) => (
                                <div 
                                  key={idx} 
                                      className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <BedDouble className="w-12 h-12" />
                      </div>
                    )}
                  </div>

                      {/* Content Section */}
                      <div className="flex-1 p-6 flex flex-col">
                        <div className="flex-1">
                          <h4 className="font-semibold text-xl text-gray-900 mb-3">{variant.name}</h4>
                          
                          {variant.description && (
                            <p className="text-gray-700 text-[15px] leading-relaxed mb-4">{variant.description}</p>
                          )}

                          {/* Amenities with Icons - Booking.com Style */}
                          {relevantAmenities.length > 0 && (
                            <div className="mb-4">
                              <h5 className="text-sm font-semibold text-gray-900 mb-3">Room facilities</h5>
                              <div className="grid grid-cols-2 gap-y-2">
                                {relevantAmenities.map(([key, _]) => {
                                  const amenityName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                                  return (
                                    <div key={key} className="flex items-center gap-2 text-sm text-gray-700">
                                      {getAmenityIcon(key)}
                                      <span>{amenityName}</span>
                                    </div>
                                  )
                                })}
                                {/* Always show these for accommodation */}
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                  <Check className="w-4 h-4 text-green-600" />
                                  <span>Private Bathroom</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                  <Check className="w-4 h-4 text-green-600" />
                                  <span>Free WiFi</span>
                                </div>
                      </div>
                            </div>
                          )}
                    </div>
                    
                        {/* Bottom Section - Pricing & Action */}
                        <div className="pt-4 border-t flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                          {modalIsGhosted ? (
                            /* Ghost State — Variant */
                            <>
                              <div className="flex-1">
                                <div className="text-xs text-gray-500 mt-2">
                                  Min. stay: {modalMinStay} days
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-gray-400 text-xs mb-1">Starts at</div>
                                <div className="text-xl font-bold text-gray-500 mb-2">
                                  {formatPrice(convertPrice(
                                    variant.price_per_week ?? activePackage.price_per_week ?? variant.price_per_month ?? activePackage.price_per_month ?? variant.price_per_day ?? activePackage.price_per_day ?? 0,
                                    gym.currency
                                  ))}
                                  <span className="text-xs font-normal text-gray-400 ml-1">/ {(variant.price_per_week ?? activePackage.price_per_week) ? 'week' : (variant.price_per_month ?? activePackage.price_per_month) ? 'month' : 'day'}</span>
                                </div>
                                <Button 
                                  variant="outline"
                                  className="border-2 border-[#003580] text-[#003580] hover:bg-[#003580] hover:text-white font-semibold px-6 py-2.5"
                                  onClick={() => handleExtendStay(modalMinStay)}
                                >
                                  Extend {modalNightsToUnlock} {modalNightsToUnlock === 1 ? 'day' : 'days'}
                                </Button>
                              </div>
                            </>
                          ) : (
                            /* Normal State — Variant */
                            <>
                          <div className="flex-1">
                            <div className="text-xs text-green-600 font-medium mb-2">
                         <Check className="w-3 h-3 inline mr-1" />
                         Free cancellation
                       </div>
                            <div className="text-xs text-gray-500">
                              Includes taxes and charges
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-2xl font-bold text-gray-900 mb-1">
                              {formatPrice(convertPrice(variantPriceInfo.price, gym.currency))}
                            </div>
                            <div className="text-xs text-gray-500 mb-3">
                            {isValidDuration 
                              ? `Total for ${variantPriceInfo.durationLabel}`
                              : `/ ${activePackage.type === 'training' ? 'day' : variantPriceInfo.unit}`
                            }
                            </div>
                            <Button 
                              onClick={() => activePackage && handleSelectVariant(activePackage, variant)}
                              className="bg-[#003580] hover:bg-[#003580]/90 text-white font-semibold px-6 py-2.5"
                            >
                              I'll reserve
                            </Button>
                          </div>
                            </>
                          )}
                       </div>
                    </div>
                  </div>
                </div>
               )
            })}
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  )
}