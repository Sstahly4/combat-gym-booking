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
  title: 'Terms & Conditions - CombatStay.com',
  description: 'Read our terms and conditions to understand the rules and regulations for using our platform.',
  openGraph: {
    title: 'Terms & Conditions - CombatStay.com',
    description: 'Read our terms and conditions to understand the rules and regulations for using our platform.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Terms & Conditions - CombatStay.com',
    description: 'Read our terms and conditions to understand the rules and regulations for using our platform.',
  },
  alternates: {
    canonical: '/terms',
  },
}

const TABLE_OF_CONTENTS: LegalDocTocItem[] = [
  { id: 'acceptance-of-terms', label: 'Acceptance of terms' },
  { id: 'platform-description', label: 'Platform description' },
  { id: 'user-responsibilities', label: 'User responsibilities' },
  { id: 'booking-terms', label: 'Booking process' },
  { id: 'cancellation-refunds', label: 'Cancellation and refunds' },
  { id: 'arrival-acceptance', label: 'Arrival & acceptance' },
  { id: 'safety-liability', label: 'Safety and liability' },
  { id: 'payment-terms', label: 'Payment terms' },
  { id: 'gym-partners-chargeback', label: 'Gym partners — chargeback recovery' },
  { id: 'intellectual-property', label: 'Intellectual property' },
  { id: 'prohibited-activities', label: 'Prohibited activities' },
  { id: 'dispute-resolution', label: 'Dispute resolution' },
  { id: 'limitation-liability', label: 'Limitation of liability' },
  { id: 'modifications', label: 'Modifications to terms' },
  { id: 'contact', label: 'Contact information' },
]

export default function TermsPage() {
  return (
    <LegalDocLayout
      currentPath="/terms"
      articleSlug="terms"
      title="Terms & Conditions"
      subtitle="Rules for booking training camps and gyms through CombatStay, including payments, cancellations, and safety."
      lastUpdated="March 2026"
      tableOfContents={TABLE_OF_CONTENTS}
      callout={
        <LegalDocCallout title="Before you book">
          <p>
            By using CombatStay you agree to these terms, the gym&apos;s cancellation policy shown at checkout, and
            our <LegalDocLink href="/privacy">Privacy Policy</LegalDocLink>. Combat sports training carries
            inherent risk — read the safety section before you travel.
          </p>
        </LegalDocCallout>
      }
    >
      <LegalDocBody>
        <LegalDocSection id="acceptance-of-terms" title="1. Acceptance of terms">
          <p>
            By accessing and using CombatStay.com (&quot;the Platform&quot;), you accept and agree to be bound by
            these Terms &amp; Conditions. If you do not agree to these terms, please do not use our platform.
          </p>
        </LegalDocSection>

        <LegalDocSection id="platform-description" title="2. Platform description">
          <p>
            CombatStay.com is a booking platform that connects users with training camps, gyms, and combat sports
            facilities. We facilitate bookings but are not a party to the actual training services provided by gyms.
          </p>
        </LegalDocSection>

        <LegalDocSection id="user-responsibilities" title="3. User responsibilities">
          <LegalDocSubheading>For users booking training</LegalDocSubheading>
          <LegalDocList>
            <li>You must be at least 18 years old to make a booking</li>
            <li>You are responsible for ensuring you are physically fit to participate in combat sports training</li>
            <li>You must provide accurate information when making bookings</li>
            <li>You are responsible for obtaining appropriate travel and health insurance</li>
            <li>You must comply with all gym rules and regulations</li>
            <li>You acknowledge the inherent risks of combat sports training</li>
          </LegalDocList>
          <LegalDocSubheading>For gym owners</LegalDocSubheading>
          <LegalDocList>
            <li>You must provide accurate information about your facility and services</li>
            <li>You are responsible for maintaining proper safety standards and certifications</li>
            <li>You must honor confirmed bookings</li>
            <li>You must maintain appropriate insurance coverage</li>
            <li>You are responsible for the safety and conduct of your trainers and staff</li>
          </LegalDocList>
        </LegalDocSection>

        <LegalDocSection id="booking-terms" title="4. Booking process">
          <LegalDocList>
            <li>Bookings are subject to gym availability and confirmation</li>
            <li>Payment authorization occurs at booking, but charges are processed after gym confirmation</li>
            <li>Gyms have 48 hours to confirm or decline bookings</li>
            <li>If a booking is declined, payment authorization is released and no charge occurs</li>
            <li>Booking confirmations will be sent via email</li>
          </LegalDocList>
        </LegalDocSection>

        <LegalDocSection id="cancellation-refunds" title="5. Cancellation and refunds">
          <LegalDocList>
            <li>
              You are bound by the gym&apos;s cancellation policy as shown and agreed to at checkout for that
              booking (including the cancellation deadline and refund position recorded at payment).
            </li>
            <li>
              Cancellation policies vary by gym and package type; the applicable terms for your purchase are those
              presented on the package and confirmed at checkout.
            </li>
            <li>
              Free cancellation windows, where offered, are clearly displayed; card charges may be captured only
              after that window has closed, as described in checkout and payment processing notices.
            </li>
            <li>Refunds are processed according to that policy and these terms</li>
            <li>Refunds may take 5–10 business days to appear in your account</li>
            <li>We are not responsible for currency conversion fees or bank charges</li>
          </LegalDocList>
        </LegalDocSection>

        <LegalDocSection id="arrival-acceptance" title="5a. Arrival & acceptance">
          <p>
            If there is a material issue with your accommodation or gym facility upon arrival, you must report it
            to <LegalDocLink href="/contact">CombatStay support</LegalDocLink> within{' '}
            <strong>48 hours of check-in</strong> to be eligible for a platform-mediated refund. After 48 hours,
            the booking is considered accepted.
          </p>
        </LegalDocSection>

        <LegalDocSection id="safety-liability" title="6. Safety and liability">
          <p>
            <strong>Important:</strong> Combat sports training involves inherent risks of physical injury,
            including broken bones, concussions, cuts, bruises, and other serious injuries. By booking through our
            platform, you acknowledge and accept these risks. Participation in combat sports training is at your own
            risk.
          </p>
          <LegalDocList>
            <li>We are a booking platform only and do not operate, control, or manage any gym facilities</li>
            <li>
              We are not responsible for injuries, accidents, or incidents sustained during training or while on
              gym premises
            </li>
            <li>Gyms are independent entities responsible for maintaining safe facilities and proper training protocols</li>
            <li>Users are solely responsible for their own safety and must follow trainer instructions and gym rules</li>
            <li>We strongly recommend comprehensive travel and health insurance covering combat sports activities</li>
            <li>
              We are not liable for any loss, damage, injury, or death arising from your use of gym services or
              participation in training
            </li>
            <li>
              You release CombatStay.com, its affiliates, and employees from any and all claims, damages, or
              liabilities arising from your participation in combat sports training
            </li>
          </LegalDocList>
        </LegalDocSection>

        <LegalDocSection id="payment-terms" title="7. Payment terms">
          <LegalDocList>
            <li>
              <strong>Merchant of record:</strong> For card payments made through the platform, CombatStay acts as
              the merchant of record. Your payment is processed with us; the gym provides the training or related
              services as an independent supplier. What you agree to at checkout (including cancellation terms) is
              recorded with the transaction for reference if a payment is disputed.
            </li>
            <li>All prices are displayed in the selected currency</li>
            <li>Prices include applicable taxes unless otherwise stated</li>
            <li>Payment is processed securely through third-party payment processors</li>
            <li>We reserve the right to refuse or cancel bookings at our discretion</li>
            <li>
              In case of payment disputes, contact our <LegalDocLink href="/contact">support team</LegalDocLink>{' '}
              before initiating a bank or card chargeback where possible
            </li>
          </LegalDocList>
        </LegalDocSection>

        <LegalDocSection id="gym-partners-chargeback" title="7a. Gym partners — chargeback recovery">
          <p>
            If you operate a gym or training business on the platform: where permitted by law and your partner
            agreement with us, CombatStay may recover chargeback losses, refunds, or payment dispute costs from
            future payouts or other amounts owed to you. This is intended to align financial exposure with the
            booking and payment evidence we hold. This clause must be reviewed by your own lawyer before you rely
            on it commercially; it is not legal advice.
          </p>
        </LegalDocSection>

        <LegalDocSection id="intellectual-property" title="8. Intellectual property">
          <p>
            All content on the Platform, including text, graphics, logos, and software, is the property of
            CombatStay.com or its licensors and is protected by copyright and trademark laws.
          </p>
        </LegalDocSection>

        <LegalDocSection id="prohibited-activities" title="9. Prohibited activities">
          <p>You agree not to:</p>
          <LegalDocList>
            <li>Use the platform for any illegal purpose</li>
            <li>Impersonate any person or entity</li>
            <li>Interfere with or disrupt the platform&apos;s operation</li>
            <li>Attempt to gain unauthorized access to any part of the platform</li>
            <li>Post false, misleading, or defamatory content</li>
            <li>Use automated systems to access the platform without permission</li>
          </LegalDocList>
        </LegalDocSection>

        <LegalDocSection id="dispute-resolution" title="10. Dispute resolution">
          <p>
            If you have a dispute with a gym, we encourage you to contact the gym directly first. If you cannot
            resolve the issue, contact our <LegalDocLink href="/contact">support team</LegalDocLink>. We will
            attempt to facilitate resolution but are not obligated to resolve disputes between users and gyms.
          </p>
        </LegalDocSection>

        <LegalDocSection id="limitation-liability" title="11. Limitation of liability">
          <p>
            To the maximum extent permitted by law, CombatStay.com shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether
            incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses. Our
            total liability for any claims arising from your use of the platform shall not exceed the amount you
            paid for the specific booking in question. We are not responsible for the actions, omissions, or
            conduct of gyms, trainers, or other third parties.
          </p>
        </LegalDocSection>

        <LegalDocSection id="modifications" title="12. Modifications to terms">
          <p>
            We reserve the right to modify these Terms &amp; Conditions at any time. Material changes will be
            communicated through the platform or via email. Continued use of the platform after changes constitutes
            acceptance of the modified terms.
          </p>
        </LegalDocSection>

        <LegalDocSection id="contact" title="13. Contact information">
          <p>
            For questions about these Terms &amp; Conditions, please contact us through our{' '}
            <LegalDocLink href="/contact">support page</LegalDocLink>.
          </p>
          <p className="text-sm text-gray-600">
            The merchant-of-record, checkout-policy, and partner recovery clauses above are for transparency and
            must be reviewed by qualified counsel in your jurisdiction before you treat them as legally complete.
          </p>
        </LegalDocSection>
      </LegalDocBody>
    </LegalDocLayout>
  )
}
