/**
 * Find nearby landmarks using OpenStreetMap Nominatim API
 * Uses full address for more reliable results
 * Returns landmarks within walking distance (up to 2km)
 */
export async function getNearbyLandmarks(
  address: string | null,
  latitude: number | null,
  longitude: number | null,
  city: string,
  country: string
): Promise<Array<{ name: string; distance: number }>> {
  // Prefer address over coordinates for more reliable results
  let baseLat = latitude
  let baseLon = longitude

  // If no address or coordinates, we can't proceed
  if (!address && (!latitude || !longitude)) {
    console.warn(`⚠️ No address or coordinates provided for landmarks search`)
    return []
  }

  try {
    // Always geocode the address to ensure we have accurate coordinates
    // This is more reliable than trusting stored coordinates
    if (address) {
      try {
        // Use address as-is (it should already contain city/country info)
        // If address doesn't include country, append it
        let searchQuery = address.trim()
        if (!searchQuery.toLowerCase().includes(country.toLowerCase())) {
          searchQuery = `${searchQuery}, ${country}`
        }
        
        console.log(`🔍 Geocoding address: "${searchQuery}"`)
        
        const geocodeResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(searchQuery)}&` +
          `format=json&limit=1&addressdetails=1&` +
          `accept-language=en`, // Request English language
          {
            headers: {
              'User-Agent': 'CombatBooking/1.0',
            },
          }
        )

        if (geocodeResponse.ok) {
          const geocodeData = await geocodeResponse.json()
          if (geocodeData.length > 0 && geocodeData[0].lat && geocodeData[0].lon) {
            baseLat = parseFloat(geocodeData[0].lat)
            baseLon = parseFloat(geocodeData[0].lon)
            console.log(`✅ Geocoded "${searchQuery}" to: ${baseLat}, ${baseLon}`)
          } else {
            console.warn(`⚠️ No geocoding results for: ${searchQuery}`)
            // Try a simpler search with just city and country as fallback
            if (city && country) {
              console.log(`🔄 Trying fallback geocoding with city: ${city}, ${country}`)
              const fallbackResponse = await fetch(
                `https://nominatim.openstreetmap.org/search?` +
                `q=${encodeURIComponent(`${city}, ${country}`)}&` +
                `format=json&limit=1&addressdetails=1&` +
                `accept-language=en`,
                {
                  headers: {
                    'User-Agent': 'CombatBooking/1.0',
                  },
                }
              )
              if (fallbackResponse.ok) {
                const fallbackData = await fallbackResponse.json()
                if (fallbackData.length > 0 && fallbackData[0].lat && fallbackData[0].lon) {
                  baseLat = parseFloat(fallbackData[0].lat)
                  baseLon = parseFloat(fallbackData[0].lon)
                  console.log(`✅ Fallback geocoding successful: ${baseLat}, ${baseLon}`)
                }
              }
            }
          }
        } else {
          console.warn(`⚠️ Geocoding failed with status: ${geocodeResponse.status} for ${searchQuery}`)
        }
      } catch (error) {
        console.error('Error geocoding address:', error)
      }
    }

    if (!baseLat || !baseLon) {
      console.warn(`⚠️ No coordinates available for landmarks search. Address: ${address}, Lat: ${latitude}, Lon: ${longitude}`)
      return []
    }

    // Use reverse geocoding to find nearby points of interest
    // Search for common landmarks near the location
    const searchTerms = [
      'tourist attraction',
      'park',
      'beach',
      'shopping center',
      'market',
    ]

    const landmarks: Array<{ name: string; distance: number }> = []

    // Use reverse geocoding with a bounding box around the location
    try {
      // Get nearby places using reverse geocoding
      const reverseResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?` +
        `lat=${baseLat}&lon=${baseLon}&` +
        `format=json&` +
        `zoom=16&` +
        `addressdetails=1&` +
        `accept-language=en`, // Request English language
        {
          headers: {
            'User-Agent': 'CombatBooking/1.0',
          },
        }
      )

      if (reverseResponse.ok) {
        const reverseData = await reverseResponse.json()
        // Extract nearby places from the address details
        if (reverseData.address) {
          const addressParts = reverseData.address
          // Look for interesting nearby features
          if (addressParts.leisure || addressParts.tourism || addressParts.amenity) {
            const name = reverseData.display_name?.split(',')[0] || reverseData.name || 'Nearby area'
            landmarks.push({ name, distance: 0.1 }) // Very close
          }
        }
      }
    } catch (error) {
      console.error('Error in reverse geocoding:', error)
    }

    // Search for specific landmark types in the area
    for (const term of searchTerms.slice(0, 2)) { // Limit to 2 searches to avoid rate limits
      try {
        // Add a small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Use bounding box search for more accurate results
        const bbox = [
          baseLon! - 0.02, // ~2km west
          baseLat! - 0.02, // ~2km south
          baseLon! + 0.02, // ~2km east
          baseLat! + 0.02, // ~2km north
        ].join(',')

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(term)}&` +
          `bounded=1&` +
          `viewbox=${bbox}&` +
          `format=json&limit=5&` +
          `addressdetails=1&` +
          `accept-language=en`, // Request English language
          {
            headers: {
              'User-Agent': 'CombatBooking/1.0',
            },
          }
        )

        if (!response.ok) {
          console.warn(`Nominatim API returned ${response.status} for ${term}`)
          continue
        }

        const data = await response.json()

        if (!Array.isArray(data) || data.length === 0) {
          console.log(`No results for search term: ${term} near ${city}`)
          continue
        }

        console.log(`Found ${data.length} results for ${term} near ${city}`)

        for (const item of data) {
          if (!item.lat || !item.lon || !item.display_name) continue

          const distance = calculateDistance(
            baseLat!,
            baseLon!,
            parseFloat(item.lat),
            parseFloat(item.lon)
          )

          // Only include landmarks within 2km (walking distance)
          if (distance <= 2) {
            // Extract name - prioritize English name, then try to extract from display_name
            let name = item.name || ''
            
            // If no name or name contains non-Latin characters (likely Thai), try display_name
            if (!name || /[^\x00-\x7F]/.test(name)) {
              // Try to get English name from display_name (usually first part)
              const displayParts = item.display_name?.split(',') || []
              name = displayParts.find(part => /^[a-zA-Z0-9\s\-'"]+$/.test(part.trim())) || displayParts[0] || 'Nearby attraction'
            }
            
            // Clean up the name
            const cleanName = name.trim() || 'Nearby attraction'
            
            // Skip if name is still in non-Latin script (Thai, etc.)
            if (/^[^\x00-\x7F]+$/.test(cleanName)) {
              console.log(`Skipped landmark with non-Latin name: ${cleanName}`)
              continue
            }
            
            // Avoid duplicates
            if (!landmarks.some(l => l.name === cleanName)) {
              landmarks.push({ name: cleanName, distance })
              console.log(`✅ Added landmark: ${cleanName} (${distance.toFixed(2)}km)`)
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching ${term}:`, error)
        continue
      }
    }

    // Sort by distance and return top 3
    const result = landmarks
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)
      .map(item => ({
        name: item.name,
        distance: Math.round(item.distance * 10) / 10, // Round to 1 decimal
      }))
    
    console.log(`Final landmarks for ${city}:`, result)
    return result
  } catch (error) {
    console.error('Error fetching nearby landmarks:', error)
    return []
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Format landmarks into a natural language sentence
 */
export function formatLandmarksText(
  landmarks: Array<{ name: string; distance: number }>
): string {
  if (landmarks.length === 0) return ''

  const formatted = landmarks.map((landmark) => {
    const distanceText =
      landmark.distance < 1
        ? `${Math.round(landmark.distance * 1000)}m`
        : `${landmark.distance}km`
    return `${landmark.name} (${distanceText})`
  })

  if (formatted.length === 1) {
    return `${formatted[0]} is within walking distance.`
  } else if (formatted.length === 2) {
    return `${formatted[0]} and ${formatted[1]} are within walking distance.`
  } else {
    return `${formatted.slice(0, -1).join(', ')}, and ${formatted[formatted.length - 1]} are within walking distance.`
  }
}
