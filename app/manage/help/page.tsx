'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ManageBreadcrumbs } from '@/components/manage/manage-breadcrumbs'
import { OWNER_HELP_FAQS } from '@/lib/constants/owner-help-faqs'
import { ChevronDown, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ManageHelpPage() {
  const [openId, setOpenId] = useState<string | null>(OWNER_HELP_FAQS[0]?.id ?? null)

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <ManageBreadcrumbs items={[{ label: 'Dashboard', href: '/manage' }, { label: 'Help center' }]} />
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">Help center</h1>
        <p className="mt-1 text-sm text-gray-500">
          Quick answers for gym owners. Everything stays in your dashboard.
        </p>

        <div className="mt-6 space-y-2 rounded-lg border border-gray-200 bg-white shadow-sm sm:mt-8">
          {OWNER_HELP_FAQS.map((item) => {
            const open = openId === item.id
            return (
              <div key={item.id} className="border-b border-gray-100 last:border-0">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : item.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left text-sm font-medium text-gray-900 transition hover:bg-slate-50/80"
                  aria-expanded={open}
                >
                  {item.question}
                  <ChevronDown
                    className={cn('h-4 w-4 shrink-0 text-gray-400 transition-transform', open && 'rotate-180')}
                    aria-hidden
                  />
                </button>
                {open ? (
                  <div className="border-t border-gray-100 bg-slate-50/40 px-4 pb-4 pt-0">
                    <p className="pt-3 text-sm leading-relaxed text-gray-600">{item.answer}</p>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>

        <p className="mt-6 text-sm text-gray-500 sm:mt-8">
          Looking for traveler policies, safety, and booking terms?{' '}
          <a
            href="/faq"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-[#003580] underline underline-offset-2 hover:text-[#002a66]"
          >
            Open full Help Center
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>{' '}
          (opens in a new tab).
        </p>

        <div className="mt-4 rounded-lg border border-gray-200 bg-slate-50/60 p-4 text-sm text-gray-600 sm:mt-6">
          <p className="font-medium text-gray-900">Contact</p>
          <p className="mt-1">
            Need something else?{' '}
            <Link href="/contact" className="font-medium text-[#003580] underline underline-offset-2">
              Contact support
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
