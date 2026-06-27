import { buildFaqLd } from '@/lib/seo/guide-schema'
import { HELP_CENTER_FAQ_SCHEMA } from '@/lib/help/support-pages'

export function FaqJsonLd() {
  const faqLd = buildFaqLd(HELP_CENTER_FAQ_SCHEMA)

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
    />
  )
}
