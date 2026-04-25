import type { Gym } from '@/lib/types/database'

export interface PropertyHighlight {
  icon: 'location' | 'bed' | 'dumbbell' | 'building' | 'utensils' | 'star' | 'calendar' | 'users' | 'wifi' | 'car'
  title: string
  description: string
}

export interface PropertyHighlightsData {
  mainHighlights: PropertyHighlight[]
  breakfastInfo?: string
  roomsWith?: PropertyHighlight[]
  loyalCustomers?: string
}

interface GenerateHighlightsParams {
  gym: Gym
  averageRating: number
  reviewCount?: number
  checkin?: string
  checkout?: string
}

/**
 * Generate intelligent property highlights based on gym data and selected dates
 * Returns structured data matching Booking.com's format
 */
export function generatePropertyHighlights({
  gym,
  averageRating,
  reviewCount = 0,
  checkin,
  checkout
}: GenerateHighlightsParams): PropertyHighlightsData {
  const mainHighlights: PropertyHighlight[] = []
  const roomsWith: PropertyHighlight[] = []

  // Calculate trip duration and build a training-appropriate label
  let durationHighlight: { title: string; description: string } | null = null
  let durationDays = 0
  if (checkin && checkout) {
    const start = new Date(checkin)
    const end = new Date(checkout)
    durationDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    if (durationDays === 1) {
      // Single day — frame as a session, not a "night trip"
      durationHighlight = {
        title: 'Perfect for a single session!',
        description: 'Drop-in or taster training available'
      }
    } else if (durationDays >= 2 && durationDays <= 3) {
      durationHighlight = {
        title: `Great for a ${durationDays}-day training stint!`,
        description: 'Short intensive training block'
      }
    } else if (durationDays >= 4 && durationDays <= 6) {
      durationHighlight = {
        title: `Perfect for a ${durationDays}-day camp!`,
        description: 'A solid block of focused training'
      }
    } else if (durationDays >= 7 && durationDays < 14) {
      durationHighlight = {
        title: 'Great for a 1-week stay!',
        description: 'A popular length for first-time camp visits'
      }
    } else if (durationDays >= 14 && durationDays < 21) {
      durationHighlight = {
        title: 'Perfect for a 2-week camp!',
        description: 'Enough time to see real progress in training'
      }
    } else if (durationDays >= 21 && durationDays < 28) {
      durationHighlight = {
        title: 'Great for a 3-week training block!',
        description: 'Serious commitment — real results follow'
      }
    } else if (durationDays >= 28 && durationDays < 56) {
      const months = Math.floor(durationDays / 30)
      durationHighlight = {
        title: months === 1 ? 'Perfect for a 1-month stay!' : `Great for a ${months}-month stay!`,
        description: months === 1
          ? 'The sweet spot for transformative training'
          : 'Long-term immersion for serious athletes'
      }
    } else if (durationDays >= 56) {
      const months = Math.floor(durationDays / 30)
      durationHighlight = {
        title: `Great for a ${months}-month training camp!`,
        description: 'Full immersion — ideal for dedicated athletes'
      }
    }
  }

  // Main highlights section
  // 1. Duration-aware training label (if dates selected)
  if (durationHighlight) {
    mainHighlights.push({
      icon: 'calendar',
      title: durationHighlight.title,
      description: durationHighlight.description
    })
  }

  // 2. Top location (if has good ratings)
  if (averageRating >= 4.0) {
    mainHighlights.push({
      icon: 'location',
      title: 'Top location',
      description: `Highly rated by recent guests (${averageRating.toFixed(1)})`
    })
  } else if (averageRating > 0) {
    mainHighlights.push({
      icon: 'location',
      title: 'Great location',
      description: `Rated ${averageRating.toFixed(1)}/5 by recent guests`
    })
  }

  // 3. Training quality
  if (gym.disciplines && gym.disciplines.length > 0) {
    if (gym.disciplines.length === 1) {
      mainHighlights.push({
        icon: 'dumbbell',
        title: `${gym.disciplines[0]} focused`,
        description: 'Specialized training program'
      })
    } else if (gym.disciplines.length >= 3) {
      mainHighlights.push({
        icon: 'dumbbell',
        title: 'Multiple disciplines',
        description: `${gym.disciplines.slice(0, 3).join(', ')}${gym.disciplines.length > 3 ? ' & more' : ''}`
      })
    } else {
      mainHighlights.push({
        icon: 'dumbbell',
        title: 'All levels welcome',
        description: 'Beginner to advanced training'
      })
    }
  } else {
    mainHighlights.push({
      icon: 'dumbbell',
      title: 'All levels welcome',
      description: 'Beginner to advanced training'
    })
  }

  // Rooms with section (accommodation features)
  const hasAccommodation = gym.amenities?.accommodation || 
    (Array.isArray((gym as any).packages) && (gym as any).packages.some((pkg: any) => pkg.type === 'accommodation' || pkg.type === 'all_inclusive'))
  
  if (hasAccommodation) {
    roomsWith.push({
      icon: 'bed',
      title: 'On-site accommodation',
      description: 'Stay and train at the same location'
    })
  }

  // Add room features
  if (gym.amenities?.wifi) {
    roomsWith.push({
      icon: 'wifi',
      title: 'Free WiFi',
      description: 'High-speed internet access'
    })
  }

  if (gym.amenities?.parking) {
    roomsWith.push({
      icon: 'car',
      title: 'Private parking',
      description: 'Parking available at the gym'
    })
  }

  // Breakfast info (if meals available)
  let breakfastInfo: string | undefined
  const hasMeals = gym.amenities?.meals ||
    (Array.isArray((gym as any).packages) && (gym as any).packages.some((pkg: any) => pkg.type === 'all_inclusive' || pkg.includes_meals))
  
  if (hasMeals) {
    breakfastInfo = 'Meal plans available'
  }

  // Loyal customers (if has many reviews)
  let loyalCustomers: string | undefined
  if (reviewCount >= 5) {
    loyalCustomers = `There are more repeat guests here than most other properties.`
  }

  return {
    mainHighlights: mainHighlights.slice(0, 3), // Top 3 main highlights
    breakfastInfo,
    roomsWith: roomsWith.length > 0 ? roomsWith : undefined,
    loyalCustomers
  }
}
