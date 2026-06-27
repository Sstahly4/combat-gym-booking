import type { Metadata } from 'next'
import { LegalDocLayout } from '@/components/legal/legal-doc-layout'
import {
  LegalDocBody,
  LegalDocCallout,
  LegalDocLink,
  LegalDocList,
  LegalDocSection,
  LegalDocSubheading,
} from '@/components/legal/legal-doc-primitives'
import type { LegalDocTocItem } from '@/lib/legal/legal-pages'

export const metadata: Metadata = {
  title: 'Privacy Policy - CombatStay.com',
  description: 'Read our privacy policy to understand how we collect, use, and protect your personal information.',
  openGraph: {
    title: 'Privacy Policy - CombatStay.com',
    description: 'Read our privacy policy to understand how we collect, use, and protect your personal information.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Privacy Policy - CombatStay.com',
    description: 'Read our privacy policy to understand how we collect, use, and protect your personal information.',
  },
  alternates: {
    canonical: '/privacy',
  },
}

const TABLE_OF_CONTENTS: LegalDocTocItem[] = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'information-we-collect', label: 'Information we collect' },
  { id: 'how-we-use', label: 'How we use your information' },
  { id: 'information-sharing', label: 'Information sharing' },
  { id: 'data-security', label: 'Data security' },
  { id: 'your-rights', label: 'Your rights' },
  { id: 'cookies', label: 'Cookies and tracking' },
  { id: 'third-party-links', label: 'Third-party links' },
  { id: 'childrens-privacy', label: "Children's privacy" },
  { id: 'changes', label: 'Changes to this policy' },
  { id: 'contact', label: 'Contact us' },
]

export default function PrivacyPage() {
  return (
    <LegalDocLayout
      currentPath="/privacy"
      articleSlug="privacy"
      title="Privacy Policy"
      subtitle="How CombatStay collects, uses, and protects your personal information when you book training camps and gyms."
      lastUpdated="June 2026"
      tableOfContents={TABLE_OF_CONTENTS}
      callout={
        <LegalDocCallout title="Your data at a glance">
          <p>
            We collect only what we need to run bookings and your account. You can request deletion anytime on our{' '}
            <LegalDocLink href="/data-deletion">data deletion page</LegalDocLink>, or contact us through{' '}
            <LegalDocLink href="/contact">customer service</LegalDocLink>.
          </p>
        </LegalDocCallout>
      }
    >
      <LegalDocBody>
        <LegalDocSection id="introduction" title="1. Introduction">
          <p>
            CombatStay.com (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your
            privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when
            you use our platform to book training camps and gyms.
          </p>
        </LegalDocSection>

        <LegalDocSection id="information-we-collect" title="2. Information we collect">
          <LegalDocSubheading>Personal information</LegalDocSubheading>
          <p>We collect information that you provide directly to us, including:</p>
          <LegalDocList>
            <li>Name, email address, phone number</li>
            <li>Payment information (processed securely through third-party payment processors)</li>
            <li>Booking details and preferences</li>
            <li>Account credentials if you create an account</li>
          </LegalDocList>

          <LegalDocSubheading>Sign-in providers (Google and Facebook)</LegalDocSubheading>
          <p>
            If you choose to sign in with Google or Facebook, we receive basic profile information from that
            provider, typically your name and email address. We use this only to create and manage your CombatStay
            account. We do not receive your Google or Facebook password. You can revoke our access at any time
            through your Google or Facebook account settings, and you can request deletion of your CombatStay data
            on our <LegalDocLink href="/data-deletion">data deletion page</LegalDocLink>.
          </p>

          <LegalDocSubheading>Automatically collected information</LegalDocSubheading>
          <p>We automatically collect certain information when you visit our platform:</p>
          <LegalDocList>
            <li>IP address and device information</li>
            <li>Browser type and version</li>
            <li>Pages visited and time spent on pages</li>
            <li>Referring website addresses</li>
          </LegalDocList>
        </LegalDocSection>

        <LegalDocSection id="how-we-use" title="3. How we use your information">
          <p>We use the information we collect to:</p>
          <LegalDocList>
            <li>Process and manage your bookings</li>
            <li>Communicate with you about your bookings and our services</li>
            <li>Send you booking confirmations and updates</li>
            <li>Respond to your inquiries and provide customer support</li>
            <li>Improve our platform and services</li>
            <li>Send you marketing communications (with your consent)</li>
            <li>Detect and prevent fraud or abuse</li>
          </LegalDocList>
        </LegalDocSection>

        <LegalDocSection id="information-sharing" title="4. Information sharing">
          <p>We share your information only in the following circumstances:</p>
          <LegalDocList>
            <li>
              <strong>With gyms:</strong> We share necessary booking information with gyms to fulfill your reservation
            </li>
            <li>
              <strong>Service providers:</strong> We share information with trusted third-party service providers who
              assist in operating our platform
            </li>
            <li>
              <strong>Legal requirements:</strong> We may disclose information if required by law or to protect our
              rights
            </li>
            <li>
              <strong>Business transfers:</strong> Information may be transferred in connection with a merger or sale of
              assets
            </li>
          </LegalDocList>
        </LegalDocSection>

        <LegalDocSection id="data-security" title="5. Data security">
          <p>
            We implement appropriate technical and organizational measures to protect your personal information.
            However, no method of transmission over the internet is 100% secure. While we strive to protect your
            information, we cannot guarantee absolute security.
          </p>
        </LegalDocSection>

        <LegalDocSection id="your-rights" title="6. Your rights">
          <p>Depending on your location, you may have the following rights:</p>
          <LegalDocList>
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>
              Request deletion of your information — see our{' '}
              <LegalDocLink href="/data-deletion">data deletion instructions</LegalDocLink>
            </li>
            <li>Object to processing of your information</li>
            <li>Request data portability</li>
            <li>Withdraw consent where processing is based on consent</li>
          </LegalDocList>
        </LegalDocSection>

        <LegalDocSection id="cookies" title="7. Cookies and tracking">
          <p>
            We use cookies and similar tracking technologies to enhance your experience, analyze usage, and assist in
            marketing efforts. You can control cookies through your browser settings, though this may affect platform
            functionality.
          </p>
        </LegalDocSection>

        <LegalDocSection id="third-party-links" title="8. Third-party links">
          <p>
            Our platform may contain links to third-party websites. We are not responsible for the privacy practices
            of these external sites. We encourage you to review their privacy policies.
          </p>
        </LegalDocSection>

        <LegalDocSection id="childrens-privacy" title="9. Children's privacy">
          <p>
            Our platform is not intended for individuals under the age of 18. We do not knowingly collect personal
            information from children. If you believe we have collected information from a child, please contact us
            immediately through our <LegalDocLink href="/contact">support page</LegalDocLink>.
          </p>
        </LegalDocSection>

        <LegalDocSection id="changes" title="10. Changes to this policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material changes by
            posting the new policy on this page and updating the &quot;Last updated&quot; date.
          </p>
        </LegalDocSection>

        <LegalDocSection id="contact" title="11. Contact us">
          <p>
            If you have questions about this Privacy Policy or wish to exercise your rights, please contact us
            through our <LegalDocLink href="/contact">support page</LegalDocLink>.
          </p>
        </LegalDocSection>
      </LegalDocBody>
    </LegalDocLayout>
  )
}
