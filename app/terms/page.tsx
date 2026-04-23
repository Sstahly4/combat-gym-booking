import type { Metadata } from 'next'

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

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms & Conditions</h1>
        <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using CombatStay.com ("the Platform"), you accept and agree to be bound by these Terms & Conditions. If you do not agree to these terms, please do not use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Platform Description</h2>
            <p>
              CombatStay.com is a booking platform that connects users with training camps, gyms, and combat sports facilities. We facilitate bookings but are not a party to the actual training services provided by gyms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. User Responsibilities</h2>
            <h3 className="text-lg font-medium text-gray-900 mb-2">For Users Booking Training</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>You must be at least 18 years old to make a booking</li>
              <li>You are responsible for ensuring you are physically fit to participate in combat sports training</li>
              <li>You must provide accurate information when making bookings</li>
              <li>You are responsible for obtaining appropriate travel and health insurance</li>
              <li>You must comply with all gym rules and regulations</li>
              <li>You acknowledge the inherent risks of combat sports training</li>
            </ul>
            <h3 className="text-lg font-medium text-gray-900 mb-2 mt-4">For Gym Owners</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>You must provide accurate information about your facility and services</li>
              <li>You are responsible for maintaining proper safety standards and certifications</li>
              <li>You must honor confirmed bookings</li>
              <li>You must maintain appropriate insurance coverage</li>
              <li>You are responsible for the safety and conduct of your trainers and staff</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Booking Process</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Bookings are subject to gym availability and confirmation</li>
              <li>Payment authorization occurs at booking, but charges are processed after gym confirmation</li>
              <li>Gyms have 48 hours to confirm or decline bookings</li>
              <li>If a booking is declined, payment authorization is released and no charge occurs</li>
              <li>Booking confirmations will be sent via email</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Cancellation and Refunds</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                You are bound by the <strong>gym's cancellation policy as shown and agreed to at checkout</strong> for that
                booking (including the cancellation deadline and refund position recorded at payment).
              </li>
              <li>Cancellation policies vary by gym and package type; the applicable terms for your purchase are those presented on the package and confirmed at checkout.</li>
              <li>Free cancellation windows, where offered, are clearly displayed; card charges may be captured only after that window has closed, as described in checkout and payment processing notices.</li>
              <li>Refunds are processed according to that policy and these terms</li>
              <li>Refunds may take 5-10 business days to appear in your account</li>
              <li>We are not responsible for currency conversion fees or bank charges</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Safety and Liability</h2>
            <p>
              <strong>IMPORTANT:</strong> Combat sports training involves inherent risks of physical injury, including but not limited to broken bones, concussions, cuts, bruises, and other serious injuries. By booking through our platform, you acknowledge and accept these risks. Participation in combat sports training is at your own risk.
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>We are a booking platform only and do not operate, control, or manage any gym facilities</li>
              <li>We are not responsible for injuries, accidents, or incidents sustained during training or while on gym premises</li>
              <li>Gyms are independent entities responsible for maintaining safe facilities and proper training protocols</li>
              <li>Users are solely responsible for their own safety and must follow trainer instructions and gym rules</li>
              <li>We strongly recommend comprehensive travel and health insurance covering combat sports activities</li>
              <li>We are not liable for any loss, damage, injury, or death arising from your use of gym services or participation in training</li>
              <li>You release CombatStay.com, its affiliates, and employees from any and all claims, damages, or liabilities arising from your participation in combat sports training</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Payment Terms</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Merchant of record:</strong> For card payments made through the platform, <strong>CombatStay</strong>{' '}
                acts as the merchant of record. Your payment is processed with us; the gym provides the training or related
                services as an independent supplier. What you agree to at checkout (including cancellation terms) is recorded
                with the transaction for reference if a payment is disputed.
              </li>
              <li>All prices are displayed in the selected currency</li>
              <li>Prices include applicable taxes unless otherwise stated</li>
              <li>Payment is processed securely through third-party payment processors</li>
              <li>We reserve the right to refuse or cancel bookings at our discretion</li>
              <li>In case of payment disputes, contact our support team before initiating a bank or card chargeback where possible</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7a. Gym partners — chargeback recovery</h2>
            <p>
              If you operate a gym or training business on the platform: where permitted by law and your partner agreement with
              us, <strong>CombatStay may recover chargeback losses, refunds, or payment dispute costs from future payouts</strong>{' '}
              or other amounts owed to you. This is intended to align financial exposure with the booking and payment evidence we
              hold. <strong>This clause must be reviewed by your own lawyer</strong> before you rely on it commercially; it is not
              legal advice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Intellectual Property</h2>
            <p>
              All content on the Platform, including text, graphics, logos, and software, is the property of CombatStay.com or its licensors and is protected by copyright and trademark laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Prohibited Activities</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use the platform for any illegal purpose</li>
              <li>Impersonate any person or entity</li>
              <li>Interfere with or disrupt the platform's operation</li>
              <li>Attempt to gain unauthorized access to any part of the platform</li>
              <li>Post false, misleading, or defamatory content</li>
              <li>Use automated systems to access the platform without permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Dispute Resolution</h2>
            <p>
              If you have a dispute with a gym, we encourage you to contact the gym directly first. If you cannot resolve the issue, contact our support team. We will attempt to facilitate resolution but are not obligated to resolve disputes between users and gyms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, CombatStay.com shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses. Our total liability for any claims arising from your use of the platform shall not exceed the amount you paid for the specific booking in question. We are not responsible for the actions, omissions, or conduct of gyms, trainers, or other third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Modifications to Terms</h2>
            <p>
              We reserve the right to modify these Terms & Conditions at any time. Material changes will be communicated through the platform or via email. Continued use of the platform after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Contact Information</h2>
            <p>
              For questions about these Terms & Conditions, please contact us through our <a href="/contact" className="text-[#003580] hover:underline">support page</a>.
            </p>
          </section>

          <div className="text-sm text-gray-500 mt-8 pt-6 border-t space-y-2">
            <p>
              <strong>Legal review:</strong> The merchant-of-record, checkout-policy, and partner recovery clauses above are
              for transparency and must be reviewed by qualified counsel in your jurisdiction before you treat them as
              legally complete.
            </p>
            <p>Last Updated: March 2026</p>
          </div>
        </div>
      </div>
    </div>
  )
}
