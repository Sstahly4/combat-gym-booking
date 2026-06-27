import { buildFaqLd } from '@/lib/seo/guide-schema'
import { PARTNER_HELP_FAQ_SCHEMA } from '@/lib/help/partner-help'

export function PartnerHelpJsonLd({ path }: { path: string }) {
  const faqLd = {
    ...buildFaqLd(PARTNER_HELP_FAQ_SCHEMA),
    mainEntityOfPage: path,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
    />
  )
}
