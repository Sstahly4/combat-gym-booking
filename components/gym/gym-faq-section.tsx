import { GuideFaqList } from '@/components/guides/guide-page-blocks'

export function GymFaqSection({ items }: { items: Array<{ q: string; a: string }> }) {
  if (items.length === 0) return null

  return (
    <section id="faq" className="border-t border-gray-200 pt-6 md:pt-8 mt-6 md:mt-10 scroll-mt-24">
      <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6">
        Frequently asked questions
      </h2>
      <GuideFaqList items={items} />
    </section>
  )
}
