'use client'

import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { SignInModal } from '@/components/sign-in-modal'
import {
  isGuestSaved,
  addGuestSave,
  removeGuestSave,
} from '@/lib/guest-saves'

interface SaveButtonProps {
  gymId: string
  initialSaved?: boolean
  onSaveChange?: (gymId: string, saved: boolean) => void
  /** When true, render in document flow (e.g. next to Reserve button) instead of absolute overlay */
  inline?: boolean
}

export function SaveButton({ gymId, initialSaved = false, onSaveChange, inline = false }: SaveButtonProps) {
  const { user, loading: authLoading } = useAuth()
  const [saved, setSaved] = useState(initialSaved)
  const [checking, setChecking] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [signInModalOpen, setSignInModalOpen] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      // Guest — read from localStorage
      setSaved(isGuestSaved(gymId))
      setChecking(false)
      return
    }
    // Authenticated — read from DB
    const supabase = createClient()
    ;(async () => {
      try {
        const { data } = await supabase
          .from('saved_gyms')
          .select('id')
          .eq('user_id', user.id)
          .eq('gym_id', gymId)
          .maybeSingle()
        setSaved(!!data)
      } finally {
        setChecking(false)
      }
    })()
  }, [user, authLoading, gymId])

  const toggle = () => {
    if (authLoading || checking || toggling) return

    if (!user) {
      // Guest: toggle in localStorage immediately, then show soft sign-in prompt on save
      if (saved) {
        removeGuestSave(gymId)
        setSaved(false)
        onSaveChange?.(gymId, false)
      } else {
        addGuestSave(gymId)
        setSaved(true)
        onSaveChange?.(gymId, true)
        // Soft prompt — heart is already filled, modal just encourages sign-in
        setSignInModalOpen(true)
      }
      return
    }

    // Authenticated: toggle in DB
    setToggling(true)
    const supabase = createClient()
    ;(async () => {
      try {
        if (saved) {
          const { error } = await supabase
            .from('saved_gyms')
            .delete()
            .eq('user_id', user.id)
            .eq('gym_id', gymId)
          if (!error) {
            setSaved(false)
            onSaveChange?.(gymId, false)
          }
        } else {
          const { error } = await supabase
            .from('saved_gyms')
            .insert({ user_id: user.id, gym_id: gymId })
          if (!error) {
            setSaved(true)
            onSaveChange?.(gymId, true)
          }
        }
      } finally {
        setToggling(false)
      }
    })()
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggle()
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <>
      <div
        className={inline ? 'relative z-10' : 'absolute top-3 right-3 z-10'}
        onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
        onPointerDown={(e) => { e.preventDefault(); e.stopPropagation() }}
      >
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onClick={handleClick}
          aria-label={saved ? 'Unsave gym' : 'Save gym'}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
        >
          <Heart
            className={`h-[18px] w-[18px] transition-colors ${
              saved ? 'fill-red-500 text-red-500' : 'fill-none text-gray-800 stroke-[2]'
            }`}
          />
        </button>
      </div>
      <SignInModal
        open={signInModalOpen}
        onOpenChange={setSignInModalOpen}
        redirectUrl="/saved"
      />
    </>
  )
}
