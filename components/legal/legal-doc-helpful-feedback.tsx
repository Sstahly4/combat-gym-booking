'use client'

import { useState } from 'react'
import Link from 'next/link'
import { legalDocLinkClass } from '@/components/legal/legal-doc-primitives'

type Vote = 'yes' | 'no' | null

export function LegalDocHelpfulFeedback({ articleSlug }: { articleSlug: string }) {
  const [vote, setVote] = useState<Vote>(null)

  if (vote) {
    return (
      <div className="border-t border-gray-200 pt-8">
        <p className="text-sm text-gray-700">
          {vote === 'yes'
            ? 'Thanks for letting us know this article was helpful.'
            : 'Thanks for your feedback. If something was unclear, tell us so we can improve it.'}
        </p>
        {vote === 'no' ? (
          <p className="mt-2 text-sm text-gray-600">
            <Link
              href={`/contact?intent=article-feedback&article=${encodeURIComponent(articleSlug)}`}
              className={legalDocLinkClass}
            >
              Provide feedback about this article
            </Link>
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="border-t border-gray-200 pt-8">
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-sm font-medium text-gray-900">Was this helpful?</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setVote('yes')}
            className="rounded border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-800 transition-colors hover:border-gray-400 hover:bg-gray-50"
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setVote('no')}
            className="rounded border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-800 transition-colors hover:border-gray-400 hover:bg-gray-50"
          >
            No
          </button>
        </div>
        <Link
          href={`/contact?intent=article-feedback&article=${encodeURIComponent(articleSlug)}`}
          className={`text-sm ${legalDocLinkClass}`}
        >
          Provide feedback about this article
        </Link>
      </div>
    </div>
  )
}
