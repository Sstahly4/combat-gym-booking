'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export type CheckoutAccordionItem = {
  id: string
  title: string
  subtitle?: string
  body: string
  link?: { href: string; label: string }
  action?: { label: string; onClick: () => void }
}

export type CheckoutAccordionSection = {
  heading?: string
  items: CheckoutAccordionItem[]
  footerText?: string
}

export function CheckoutAccordion({ sections }: { sections: CheckoutAccordionSection[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="space-y-6 pb-4">
      {sections.map((section, sectionIndex) => (
        <div key={section.heading ?? `section-${sectionIndex}`}>
          {section.heading && (
            <h3 className="text-sm font-semibold text-gray-900 mb-3">{section.heading}</h3>
          )}
          <div className="divide-y divide-gray-100 border-t border-gray-100">
            {section.items.map((item) => {
              const isOpen = openId === item.id
              return (
                <div key={item.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    className="w-full py-4 text-left flex items-start justify-between gap-4"
                    aria-expanded={isOpen}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold text-gray-900 leading-snug">
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="mt-0.5 text-sm text-gray-500 leading-snug">{item.subtitle}</p>
                      )}
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-900 shrink-0 mt-0.5 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden
                    />
                  </button>
                  {isOpen && (
                    <div className="pb-4 pr-8 space-y-2">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                        {item.body}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {item.link && (
                          <a
                            href={item.link.href}
                            target={item.link.href.startsWith('tel:') ? undefined : '_blank'}
                            rel={item.link.href.startsWith('tel:') ? undefined : 'noopener noreferrer'}
                            className="inline-block text-sm font-semibold text-gray-900 underline underline-offset-2 hover:text-gray-700 transition-colors"
                          >
                            {item.link.label}
                          </a>
                        )}
                        {item.action && (
                          <button
                            type="button"
                            onClick={item.action.onClick}
                            className="inline-flex h-10 items-center rounded-xl bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
                          >
                            {item.action.label}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {section.footerText && (
            <p className="mt-4 text-sm text-gray-700 leading-relaxed">{section.footerText}</p>
          )}
        </div>
      ))}
    </div>
  )
}
