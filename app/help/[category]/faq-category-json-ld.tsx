import { buildFaqLd } from '@/lib/seo/guide-schema'

export function FaqCategoryJsonLd({
  items,
  path,
}: {
  items: Array<{ q: string; a: string }>
  path: string
}) {
  if (items.length === 0) return null

  const faqLd = {
    ...buildFaqLd(items),
    mainEntityOfPage: path,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
    />
  )
}
