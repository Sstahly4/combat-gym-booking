'use client'

import { useEffect, useRef, useState } from 'react'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { SignInModal } from '@/components/sign-in-modal'
import {
  isGuestSaved,
  addGuestSave,
  removeGuestSave,
} from '@/lib/guest-saves'

/** Squared distance threshold: ignore tap if finger moved farther than this (horizontal scroll, etc.). */
const MOVE_CANCEL_PX = 12
const MOVE_CANCEL_SQ = MOVE_CANCEL_PX * MOVE_CANCEL_PX

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
  const skipClickAfterPointerRef = useRef(false)
  const pointerSessionCleanupRef = useRef<(() => void) | null>(null)

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

  useEffect(
    () => () => {
      pointerSessionCleanupRef.current?.()
      pointerSessionCleanupRef.current = null
    },
    [],
  )

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

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (authLoading || checking || toggling) return

    pointerSessionCleanupRef.current?.()
    pointerSessionCleanupRef.current = null

    const startX = e.clientX
    const startY = e.clientY
    const pid = e.pointerId
    let slopExceeded = false

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pid) return
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      if (dx * dx + dy * dy > MOVE_CANCEL_SQ) slopExceeded = true
    }

    const end = (ev: PointerEvent) => {
      if (ev.pointerId !== pid) return
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
      pointerSessionCleanupRef.current = null

      if (slopExceeded || ev.type === 'pointercancel') return

      skipClickAfterPointerRef.current = true
      toggle()
    }

    const cleanup = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
      pointerSessionCleanupRef.current = null
    }
    pointerSessionCleanupRef.current = cleanup

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (skipClickAfterPointerRef.current) {
      skipClickAfterPointerRef.current = false
      return
    }
    toggle()
  }

  return (
    <>
      <div
        className={inline ? 'relative z-10' : 'absolute top-3 right-3 z-10'}
        onClick={(ev) => {
          ev.preventDefault()
          ev.stopPropagation()
        }}
      >
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onClick={handleClick}
          aria-label={saved ? 'Unsave gym' : 'Save gym'}
          className="flex h-9 w-9 touch-manipulation items-center justify-center rounded-full bg-white shadow-md transition-transform duration-150 ease-out hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
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
