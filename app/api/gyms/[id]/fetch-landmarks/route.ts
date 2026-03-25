import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getNearbyLandmarks } from '@/lib/utils/landmarks'

/**
 * API endpoint to fetch and cache landmarks for a gym
 * This should be called:
 * - When a new gym is created/approved
 * - Manually by admin/gym owner to refresh landmarks
 * - Via a background job/cron
 * 
 * NOT called on every page load!
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const gymId = params.id

    // Get gym data
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('*')
      .eq('id', gymId)
      .single()

    if (gymError || !gym) {
      return NextResponse.json({ error: 'Gym not found' }, { status: 404 })
    }

    // Check if we already have cached landmarks
    if (gym.nearby_attractions && Array.isArray(gym.nearby_attractions) && gym.nearby_attractions.length > 0) {
      return NextResponse.json({ 
        message: 'Landmarks already cached',
        landmarks: gym.nearby_attractions 
      })
    }

    // Fetch landmarks from OpenStreetMap
    if (!gym.address && (!gym.latitude || !gym.longitude)) {
      return NextResponse.json({ 
        error: 'Gym needs address or coordinates to fetch landmarks' 
      }, { status: 400 })
    }

    console.log(`🔍 Fetching landmarks for gym: ${gym.name}`)
    const landmarks = await getNearbyLandmarks(
      gym.address,
      gym.latitude,
      gym.longitude,
      gym.city,
      gym.country
    )

    if (landmarks.length === 0) {
      return NextResponse.json({ 
        message: 'No landmarks found nearby',
        landmarks: [] 
      })
    }

    // Cache landmarks in database
    const { error: updateError } = await supabase
      .from('gyms')
      .update({ nearby_attractions: landmarks })
      .eq('id', gymId)

    if (updateError) {
      console.error('Error caching landmarks:', updateError)
      return NextResponse.json({ error: 'Failed to cache landmarks' }, { status: 500 })
    }

    console.log(`✅ Cached ${landmarks.length} landmarks for ${gym.name}`)

    return NextResponse.json({ 
      message: 'Landmarks fetched and cached successfully',
      landmarks 
    })
  } catch (error: any) {
    console.error('Error in fetch-landmarks API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
