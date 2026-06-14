'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, Copy } from 'lucide-react'

export function CopyReferralLink({
  url,
  label = 'Copy link',
  prominent = false,
}: {
  url: string
  label?: string
  prominent?: boolean
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  if (prominent) {
    return (
      <Button
        type="button"
        size="lg"
        className="h-14 w-full max-w-sm text-base font-semibold shadow-md"
        onClick={copy}
      >
        {copied ? <Check className="mr-2 h-5 w-5" /> : <Copy className="mr-2 h-5 w-5" />}
        {copied ? 'Copied!' : label}
      </Button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="rounded-md bg-stone-100 px-2 py-1 text-sm text-stone-800">{url}</code>
      <Button type="button" variant="outline" size="sm" onClick={copy}>
        {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
        {copied ? 'Copied' : label}
      </Button>
    </div>
  )
}
