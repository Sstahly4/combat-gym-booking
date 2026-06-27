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
  title: 'Delete Your Data - CombatStay.com',
  description:
    'How to request deletion of your CombatStay account and personal data, including data received through Google or Facebook sign-in.',
  openGraph: {
    title: 'Delete Your Data - CombatStay.com',
    description:
      'How to request deletion of your CombatStay account and personal data, including data received through Google or Facebook sign-in.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Delete Your Data - CombatStay.com',
    description:
      'How to request deletion of your CombatStay account and personal data, including data received through Google or Facebook sign-in.',
  },
  alternates: {
    canonical: '/data-deletion',
  },
}

const TABLE_OF_CONTENTS: LegalDocTocItem[] = [
  { id: 'what-data-we-store', label: 'What data we store' },
  { id: 'how-to-request', label: 'How to request deletion' },
  { id: 'after-deletion', label: 'What happens after deletion' },
  { id: 'disconnect-google-facebook', label: 'Disconnect Google or Facebook' },
  { id: 'related-policies', label: 'Related policies' },
]

export default function DataDeletionPage() {
  return (
    <LegalDocLayout
      currentPath="/data-deletion"
      articleSlug="data-deletion"
      title="Delete your account & data"
      subtitle="CombatStay lets you sign in with Google, Facebook, or email. Follow these steps if you want us to delete your account and personal data."
      lastUpdated="June 2026"
      tableOfContents={TABLE_OF_CONTENTS}
      callout={
        <LegalDocCallout title="To request deletion">
          <p>
            Use our <LegalDocLink href="/contact?intent=data-deletion">contact form</LegalDocLink> or email{' '}
            <LegalDocLink href="mailto:hello@combatstay.com?subject=Data%20deletion%20request">
              hello@combatstay.com
            </LegalDocLink>{' '}
            from the address linked to your account. We aim to complete verified requests within{' '}
            <strong>30 days</strong>.
          </p>
        </LegalDocCallout>
      }
    >
      <LegalDocBody>
        <LegalDocSection id="what-data-we-store" title="What data we store">
          <p>When you use CombatStay, we may store:</p>
          <LegalDocList>
            <li>Account details (name, email address, sign-in method)</li>
            <li>Profile preferences and saved gyms</li>
            <li>Booking history and messages related to your reservations</li>
            <li>Security and sign-in activity needed to protect your account</li>
          </LegalDocList>
          <p>
            If you sign in with Google or Facebook, we receive basic profile information from that provider
            (typically your name and email address). We do not receive your Google or Facebook password.
          </p>
        </LegalDocSection>

        <LegalDocSection id="how-to-request" title="How to request deletion">
          <LegalDocList ordered>
            <li>
              Send us a deletion request using our{' '}
              <LegalDocLink href="/contact?intent=data-deletion">contact form</LegalDocLink> (the subject will be
              pre-filled) or email{' '}
              <LegalDocLink href="mailto:hello@combatstay.com?subject=Data%20deletion%20request">
                hello@combatstay.com
              </LegalDocLink>{' '}
              with the subject line <strong>Data deletion request</strong>.
            </li>
            <li>
              Include the <strong>email address</strong> linked to your CombatStay account. If you have an active
              booking, include your <strong>booking reference</strong> so we can confirm identity.
            </li>
            <li>
              We will verify that you own the account, then delete or anonymise your personal data and close your
              account.
            </li>
          </LegalDocList>
        </LegalDocSection>

        <LegalDocSection id="after-deletion" title="What happens after deletion">
          <LegalDocList>
            <li>Your CombatStay account is closed and you will no longer be able to sign in.</li>
            <li>Personal profile data, saved gyms, and marketing preferences are removed or anonymised.</li>
            <li>
              Some booking and payment records may be kept in anonymised or minimal form where we are legally
              required to do so (for example tax, fraud prevention, or dispute resolution).
            </li>
          </LegalDocList>
        </LegalDocSection>

        <LegalDocSection id="disconnect-google-facebook" title="Disconnect Google or Facebook">
          <p>
            Deleting your CombatStay account does not remove CombatStay from your Google or Facebook account
            settings. You can revoke our access at any time:
          </p>
          <LegalDocList>
            <li>
              Google:{' '}
              <LegalDocLink href="https://myaccount.google.com/permissions" external>
                Google Account → Third-party access
              </LegalDocLink>
            </li>
            <li>
              Facebook:{' '}
              <LegalDocLink href="https://www.facebook.com/settings?tab=applications" external>
                Facebook → Settings → Apps and websites
              </LegalDocLink>
            </li>
          </LegalDocList>
        </LegalDocSection>

        <LegalDocSection id="related-policies" title="Related policies">
          <p>
            For more on how we collect and use data, see our{' '}
            <LegalDocLink href="/privacy">Privacy Policy</LegalDocLink>. For other account questions, visit the{' '}
            <LegalDocLink href="/faq">Help Center</LegalDocLink> or{' '}
            <LegalDocLink href="/contact">Customer service</LegalDocLink>.
          </p>
        </LegalDocSection>
      </LegalDocBody>
    </LegalDocLayout>
  )
}
