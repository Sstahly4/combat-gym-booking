'use client'

import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { toAffiliateReferralShareText } from '@/lib/affiliates/urls'
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
  const shareUrl = toAffiliateReferralShareText(url)

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }, [shareUrl])

  if (prominent) {
    return (
      <div className="flex w-full flex-col gap-3">
        <button
          type="button"
          onClick={copy}
          className="w-full break-all rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-left font-mono text-base font-semibold text-[#003580] transition hover:bg-stone-100 sm:text-lg"
          title="Click to copy"
        >
          {shareUrl}
        </button>
        <p className="text-xs text-stone-500">{copied ? 'Copied to clipboard' : 'Tap the link to copy'}</p>
        <Button
          type="button"
          size="lg"
          className="h-12 w-full text-base font-semibold sm:max-w-xs"
          onClick={copy}
        >
          {copied ? <Check className="mr-2 h-5 w-5" /> : <Copy className="mr-2 h-5 w-5" />}
          {copied ? 'Copied!' : label}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={copy}
        className="rounded-md bg-stone-100 px-2 py-1 text-left font-mono text-sm text-stone-800 transition hover:bg-stone-200"
        title="Click to copy"
      >
        {shareUrl}
      </button>
      <Button type="button" variant="outline" size="sm" onClick={copy}>
        {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
        {copied ? 'Copied' : label}
      </Button>
    </div>
  )
}
