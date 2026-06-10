'use client'

import { CHECKOUT_CANCELLATION_POLICY_DOC } from '@/lib/booking/cancellation-policy-docs'
import { CheckoutBottomSheet } from '@/components/booking/checkout-bottom-sheet'

export function CheckoutCancellationFullPolicySheet({
  onClose,
}: {
  onClose: () => void
}) {
  return (
    <CheckoutBottomSheet
      layer="nested"
      title="Full cancellation policy"
      primaryLabel="Done"
      onPrimary={onClose}
      onCancel={onClose}
      onClose={onClose}
    >
      <div className="space-y-6 pb-4 text-sm text-gray-700 leading-relaxed">
        {CHECKOUT_CANCELLATION_POLICY_DOC.map((section) => (
          <section key={section.title}>
            <h3 className="text-[15px] font-semibold text-gray-900 mb-2">{section.title}</h3>
            <div className="space-y-3">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.bullets && section.bullets.length > 0 && (
                <ul className="list-disc space-y-2 pl-5">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>
      <div className="flex-1 min-h-0" aria-hidden />
    </CheckoutBottomSheet>
  )
}
