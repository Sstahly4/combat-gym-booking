import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import type { ThailandGuideCalloutLinks } from '@/lib/search/thailand-muay-thai-guide-callout'

export function ThailandMuayThaiGuideCallout({ links }: { links: ThailandGuideCalloutLinks }) {
  return (
    <div className="mb-4 rounded-xl border border-[#003580]/15 bg-[#f0f6ff] px-4 py-3 text-sm text-gray-800">
      <div className="flex items-start gap-2">
        <BookOpen className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#003580]" aria-hidden />
        <div>
          <p className="font-medium text-gray-900">Planning a Thailand camp?</p>
          <p className="mt-1 text-gray-600">
            Compare ranked gyms with live prices and reviews in our{' '}
            <Link
              href={links.flagship.href}
              className="font-medium text-[#003580] underline underline-offset-2 hover:text-[#00224d]"
            >
              {links.flagship.label}
            </Link>
            {links.cityGuide ? (
              <>
                {' '}
                or see{' '}
                <Link
                  href={links.cityGuide.href}
                  className="font-medium text-[#003580] underline underline-offset-2 hover:text-[#00224d]"
                >
                  {links.cityGuide.label}
                </Link>
              </>
            ) : null}
            .
          </p>
        </div>
      </div>
    </div>
  )
}
