'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { DateRangePicker } from '@/components/date-range-picker'
import { useBooking } from '@/lib/contexts/booking-context'

const DISCIPLINES = ['Muay Thai', 'MMA', 'BJJ', 'Boxing', 'Wrestling', 'Kickboxing']
const PLACEHOLDERS = [
  'What sport are you training?',
  'Got any plans?',
  'Professional fighter looking for a gym?',
  'Where are you going?',
  'Find your next camp...',
  'Looking for training?',
  'Ready to level up your skills?',
  'Search for gyms...',
  'Planning your fight camp?',
  'What\'s your next destination?',
  'Time to train?',
  'Find the perfect gym...'
]

// Parse search query to extract location and discipline
function parseSearchQuery(query: string): { location: string; discipline: string } {
  const trimmed = query.trim()
  if (!trimmed) return { location: '', discipline: '' }

  // Check if any discipline is mentioned
  let foundDiscipline = ''
  const queryLower = trimmed.toLowerCase()
  
  for (const disc of DISCIPLINES) {
    const discLower = disc.toLowerCase()
    // Check for exact match or partial match (e.g., "muay thai", "bjj")
    if (queryLower.includes(discLower)) {
      foundDiscipline = disc
      break
    }
    // Also check for common abbreviations
    if (discLower === 'bjj' && (queryLower.includes('jiu jitsu') || queryLower.includes('jiujitsu'))) {
      foundDiscipline = disc
      break
    }
    if (discLower === 'muay thai' && (queryLower.includes('muaythai') || queryLower.includes('muay'))) {
      foundDiscipline = disc
      break
    }
  }

  // Remove discipline from query to get location
  let location = trimmed
  if (foundDiscipline) {
    location = trimmed
      .replace(new RegExp(foundDiscipline, 'gi'), '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  return {
    location: location || '',
    discipline: foundDiscipline
  }
}

export function SearchForm() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  
  // Use shared booking context for dates so gym card links stay in sync
  const { checkin, setCheckin, checkout, setCheckout } = useBooking()

  const [displayedPlaceholder, setDisplayedPlaceholder] = useState(PLACEHOLDERS[0])
  const placeholderIndexRef = useRef(0)
  const typeIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Rotate placeholder text with smooth typing animation
  useEffect(() => {
    const typePlaceholder = (text: string) => {
      // Clear any existing typing animation
      if (typeIntervalRef.current) {
        clearInterval(typeIntervalRef.current)
      }
      
      let currentText = ''
      let charIndex = 0
      
      typeIntervalRef.current = setInterval(() => {
        if (charIndex < text.length) {
          currentText += text[charIndex]
          setDisplayedPlaceholder(currentText)
          charIndex++
        } else {
          if (typeIntervalRef.current) {
            clearInterval(typeIntervalRef.current)
            typeIntervalRef.current = null
          }
        }
      }, 30) // Type each character every 30ms for smooth effect
    }
    
    const rotatePlaceholder = () => {
      placeholderIndexRef.current = (placeholderIndexRef.current + 1) % PLACEHOLDERS.length
      const nextPlaceholder = PLACEHOLDERS[placeholderIndexRef.current]
      
      // Start typing the next placeholder
      typePlaceholder(nextPlaceholder)
    }
    
    // Start rotating after 16 seconds
    const rotateInterval = setInterval(rotatePlaceholder, 16000)

    return () => {
      clearInterval(rotateInterval)
      if (typeIntervalRef.current) {
        clearInterval(typeIntervalRef.current)
      }
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const { location, discipline } = parseSearchQuery(searchQuery)
    const params = new URLSearchParams()
    
    // Combine location and discipline into a single query for the search page
    if (location || discipline) {
      params.set('query', searchQuery.trim())
    }
    if (location) params.set('location', location)
    if (discipline) params.set('discipline', discipline)
    if (checkin) params.set('checkin', checkin)
    if (checkout) params.set('checkout', checkout)
    
    router.push(`/search?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="bg-[#febb02] p-0.5 md:p-1 rounded shadow-lg w-full">
        <div className="bg-white p-0.5 md:p-1 rounded flex flex-col md:flex-row gap-1">
          {/* Unified Search Bar */}
          <div className="flex-[2] relative group">
            <div className="absolute inset-y-0 left-2 md:left-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={displayedPlaceholder}
              className="h-10 md:h-12 border-2 border-transparent focus:border-[#003580] focus-visible:ring-0 text-sm md:text-base pl-8 md:pl-10 rounded-sm transition-all"
            />
          </div>
          
          {/* Date Range Picker */}
          <div className="flex-[1.5]">
            <DateRangePicker
              checkin={checkin}
              checkout={checkout}
              onCheckinChange={setCheckin}
              onCheckoutChange={setCheckout}
            />
          </div>

          <Button type="submit" size="lg" className="h-10 md:h-12 px-4 md:px-8 bg-[#003580] hover:bg-[#003580]/90 text-sm md:text-lg font-medium rounded-sm">
            Search
          </Button>
        </div>
      </div>
    </form>
  )
}
