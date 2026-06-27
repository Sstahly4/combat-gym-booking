'use client'

import { useCallback, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CopyClipboardButton({
  value,
  label,
  copiedLabel = 'Copied',
  className,
  size = 'sm',
}: {
  value: string
  label: string
  copiedLabel?: string
  className?: string
  size?: 'sm' | 'xs'
}) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async () => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }, [value])

  const sizeClass =
    size === 'xs'
      ? 'gap-1 px-2 py-1 text-[10px]'
      : 'gap-1.5 px-2.5 py-1.5 text-xs'

  return (
    <button
      type="button"
      onClick={copy}
      disabled={!value}
      title={label}
      className={cn(
        'inline-flex items-center rounded-md border border-stone-200 bg-white font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40',
        sizeClass,
        className,
      )}
    >
      {copied ? (
        <Check className={size === 'xs' ? 'h-3 w-3 text-emerald-600' : 'h-3.5 w-3.5 text-emerald-600'} />
      ) : (
        <Copy className={size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      )}
      {copied ? copiedLabel : label}
    </button>
  )
}
