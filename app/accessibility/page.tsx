import type { Metadata } from 'next'
import { LegalDocLayout } from '@/components/legal/legal-doc-layout'
import {
  LegalDocBody,
  LegalDocCallout,
  LegalDocLink,
  LegalDocList,
  LegalDocSection,
} from '@/components/legal/legal-doc-primitives'
import type { LegalDocTocItem } from '@/lib/legal/legal-pages'

export const metadata: Metadata = {
  title: 'Accessibility Statement - CombatStay.com',
  description: 'Learn about our commitment to digital accessibility and how we ensure our platform is accessible to everyone.',
  openGraph: {
    title: 'Accessibility Statement - CombatStay.com',
    description: 'Learn about our commitment to digital accessibility and how we ensure our platform is accessible to everyone.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Accessibility Statement - CombatStay.com',
    description: 'Learn about our commitment to digital accessibility and how we ensure our platform is accessible to everyone.',
  },
  alternates: {
    canonical: '/accessibility',
  },
}

const TABLE_OF_CONTENTS: LegalDocTocItem[] = [
  { id: 'our-commitment', label: 'Our commitment' },
  { id: 'accessibility-standards', label: 'Accessibility standards' },
  { id: 'measures', label: 'Measures we take' },
  { id: 'known-limitations', label: 'Known limitations' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'third-party-content', label: 'Third-party content' },
  { id: 'ongoing-efforts', label: 'Ongoing efforts' },
]

export default function AccessibilityPage() {
  return (
    <LegalDocLayout
      currentPath="/accessibility"
      articleSlug="accessibility"
      title="Accessibility Statement"
      subtitle="Our commitment to making CombatStay usable for everyone, including people with disabilities."
      lastUpdated="January 2026"
      tableOfContents={TABLE_OF_CONTENTS}
      callout={
        <LegalDocCallout title="Need assistance?">
          <p>
            If you encounter a barrier while using CombatStay, contact us through{' '}
            <LegalDocLink href="/contact">customer service</LegalDocLink>. We welcome specific feedback so we can
            fix issues quickly.
          </p>
        </LegalDocCallout>
      }
    >
      <LegalDocBody>
        <LegalDocSection id="our-commitment" title="Our commitment">
          <p>
            CombatStay.com is committed to ensuring digital accessibility for people with disabilities. We are
            continually improving the user experience for everyone and applying the relevant accessibility
            standards to achieve these goals.
          </p>
        </LegalDocSection>

        <LegalDocSection id="accessibility-standards" title="Accessibility standards">
          <p>
            We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards. These
            guidelines explain how to make web content more accessible for people with disabilities and
            user-friendly for everyone.
          </p>
        </LegalDocSection>

        <LegalDocSection id="measures" title="Measures we take">
          <LegalDocList>
            <li>Providing alternative text for images and visual content</li>
            <li>Ensuring proper heading structure and semantic HTML</li>
            <li>Maintaining sufficient color contrast ratios</li>
            <li>Supporting keyboard navigation throughout the platform</li>
            <li>Providing clear focus indicators for interactive elements</li>
            <li>Ensuring forms are properly labeled and accessible</li>
            <li>Making content readable and understandable</li>
          </LegalDocList>
        </LegalDocSection>

        <LegalDocSection id="known-limitations" title="Known limitations">
          <p>
            Despite our efforts to ensure accessibility, there may be some limitations. We are actively working to
            address these issues and improve accessibility across the platform. If you encounter any accessibility
            barriers, please contact us.
          </p>
        </LegalDocSection>

        <LegalDocSection id="feedback" title="Feedback">
          <p>
            We welcome your feedback on the accessibility of CombatStay.com. If you encounter accessibility barriers
            or have suggestions for improvement, please contact us through our{' '}
            <LegalDocLink href="/contact">support page</LegalDocLink>.
          </p>
        </LegalDocSection>

        <LegalDocSection id="third-party-content" title="Third-party content">
          <p>
            Some content on our platform may be provided by third parties (such as gym images and descriptions).
            While we encourage accessibility, we cannot guarantee the accessibility of all third-party content.
          </p>
        </LegalDocSection>

        <LegalDocSection id="ongoing-efforts" title="Ongoing efforts">
          <p>
            We regularly review and update our platform to improve accessibility. This includes conducting
            accessibility audits, training our team, and implementing improvements based on user feedback and
            evolving standards.
          </p>
        </LegalDocSection>
      </LegalDocBody>
    </LegalDocLayout>
  )
}
