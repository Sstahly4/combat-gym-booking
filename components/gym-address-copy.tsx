'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type Props = {
  address: string
  className?: string
}

async function copyTextToClipboard(text: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  // Fallback for older browsers / restricted contexts
  const el = document.createElement('textarea')
  el.value = text
  el.setAttribute('readonly', '')
  el.style.position = 'fixed'
  el.style.left = '-9999px'
  el.style.top = '-9999px'
  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
}

export function GymAddressCopy({ address, className }: Props) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [])

  const onCopy = useCallback(async () => {
    if (!address) return
    try {
      await copyTextToClipboard(address)
      setCopied(true)
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
      timeoutRef.current = window.setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy address:', err)
    }
  }, [address])

  if (!address) return null

  return (
    <button
      type="button"
      onClick={onCopy}
      className={[
        'text-left underline-offset-2 hover:underline cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003580] focus-visible:ring-offset-2',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      title="Click to copy address"
      aria-label="Copy address to clipboard"
    >
      <span className="break-words">{address}</span>
      {copied && (
        <span className="ml-2 text-xs font-medium text-[#003580] align-middle">
          Copied
        </span>
      )}
    </button>
  )
}

