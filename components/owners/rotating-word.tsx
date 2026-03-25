'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type RotatingWordProps = {
  words: string[]
  intervalMs?: number
  className?: string
}

const FADE_MS = 320
const FADE_EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)'

export function RotatingWord({ words, intervalMs = 1800, className = '' }: RotatingWordProps) {
  const safeWords = useMemo(() => words.filter(Boolean), [words])
  const [idx, setIdx] = useState(0)
  const [nextIdx, setNextIdx] = useState(1 % Math.max(words.length, 1))
  const [fading, setFading] = useState(false)
  const idxRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (safeWords.length <= 1) return

    const interval = setInterval(() => {
      const upcoming = (idxRef.current + 1) % safeWords.length
      setNextIdx(upcoming)
      setFading(true)

      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        idxRef.current = upcoming
        setIdx(upcoming)
        // Disable transition before resetting so there's no reverse-fade glitch
        setFading(false)
      }, FADE_MS)
    }, intervalMs)

    return () => {
      clearInterval(interval)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [intervalMs, safeWords.length])

  return (
    <span className={`relative inline-block align-baseline ${className}`}>
      {/* invisible sizer — keeps outer width stable during transition */}
      <span className="invisible whitespace-nowrap" aria-hidden="true">
        {safeWords[fading ? nextIdx : idx] ?? ''}
      </span>

      {/* current word — fades out */}
      <span
        className="absolute inset-0 whitespace-nowrap"
        style={{
          opacity: fading ? 0 : 1,
          transition: fading ? `opacity ${FADE_MS}ms ${FADE_EASING}` : 'none',
        }}
      >
        {safeWords[idx] ?? ''}
      </span>

      {/* next word — fades in */}
      <span
        className="absolute inset-0 whitespace-nowrap"
        aria-hidden={!fading}
        style={{
          opacity: fading ? 1 : 0,
          transition: fading ? `opacity ${FADE_MS}ms ${FADE_EASING}` : 'none',
        }}
      >
        {safeWords[nextIdx] ?? ''}
      </span>
    </span>
  )
}
