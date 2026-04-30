'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types/database'
import { getGuestSaves, clearGuestSaves } from '@/lib/guest-saves'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    // Safety timeout - ensure loading state is cleared after 10 seconds
    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('Auth loading timeout - forcing loading to false')
        setLoading(false)
      }
    }, 10000)

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        clearTimeout(timeoutId)
        setLoading(false)
      }
    }).catch((err) => {
      console.error('Error getting session:', err)
      if (mounted) {
        clearTimeout(timeoutId)
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        // On sign-in, sync any locally saved gyms to the DB
        if (event === 'SIGNED_IN') {
          syncGuestSaves(session.user.id)
        }
      } else {
        setProfile(null)
        clearTimeout(timeoutId)
        setLoading(false)
      }
    })

    async function syncGuestSaves(userId: string) {
      const guestSaves = getGuestSaves()
      if (guestSaves.length === 0) return
      try {
        await supabase
          .from('saved_gyms')
          .upsert(
            guestSaves.map((gymId) => ({ user_id: userId, gym_id: gymId })),
            { onConflict: 'user_id,gym_id', ignoreDuplicates: true }
          )
        clearGuestSaves()
      } catch {
        // Non-critical — guest saves remain in localStorage if sync fails
      }
    }

    async function fetchProfile(userId: string) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (!mounted) return

        if (error) {
          console.error('Error fetching profile:', error)
        }
        
        setProfile(data || null)
      } catch (err) {
        console.error('Error in fetchProfile:', err)
      } finally {
        if (mounted) {
          clearTimeout(timeoutId)
          setLoading(false)
        }
      }
    }

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const uid = session?.user?.id
    if (!uid) return
    const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single()
    if (error) {
      console.error('refreshProfile:', error)
      return
    }
    setProfile(data ?? null)
  }, [])

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
  }

  return { user, profile, loading, signOut, refreshProfile }
}
