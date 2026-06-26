import type { Metadata } from 'next'
import Link from 'next/link'

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

const linkClass = 'text-[#003580] hover:underline font-medium'

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Delete your account &amp; data</h1>
        <p className="text-gray-600 mb-8">
          CombatStay.com lets you sign in with Google, Facebook, or email. If you want us to delete your
          account and the personal data we hold about you, follow the steps below.
        </p>

        <div className="prose prose-sm max-w-none space-y-8 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">What data we store</h2>
            <p>When you use CombatStay, we may store:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Account details (name, email address, sign-in method)</li>
              <li>Profile preferences and saved gyms</li>
              <li>Booking history and messages related to your reservations</li>
              <li>Security and sign-in activity needed to protect your account</li>
            </ul>
            <p className="mt-3">
              If you sign in with <strong>Google</strong> or <strong>Facebook</strong>, we receive basic
              profile information from that provider (typically your name and email address). We do not
              receive your Google or Facebook password.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">How to request deletion</h2>
            <ol className="list-decimal pl-6 space-y-3">
              <li>
                Send us a deletion request using our{' '}
                <Link href="/contact?intent=data-deletion" className={linkClass}>
                  contact form
                </Link>{' '}
                (the subject will be pre-filled) or email{' '}
                <a href="mailto:hello@combatstay.com?subject=Data%20deletion%20request" className={linkClass}>
                  hello@combatstay.com
                </a>{' '}
                with the subject line <strong>Data deletion request</strong>.
              </li>
              <li>
                Include the <strong>email address</strong> linked to your CombatStay account. If you have an
                active booking, include your <strong>booking reference</strong> so we can confirm identity.
              </li>
              <li>
                We will verify that you own the account, then delete or anonymise your personal data and
                close your account.
              </li>
            </ol>
            <p className="mt-4 rounded-lg border border-[#003580]/15 bg-[#003580]/[0.04] px-4 py-3 text-sm text-gray-800">
              <strong>Processing time:</strong> We aim to complete verified requests within{' '}
              <strong>30 days</strong>. We will email you when deletion is finished.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">What happens after deletion</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Your CombatStay account is closed and you will no longer be able to sign in.</li>
              <li>
                Personal profile data, saved gyms, and marketing preferences are removed or anonymised.
              </li>
              <li>
                Some booking and payment records may be kept in anonymised or minimal form where we are
                legally required to do so (for example tax, fraud prevention, or dispute resolution).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Disconnect Google or Facebook</h2>
            <p>
              Deleting your CombatStay account does not remove CombatStay from your Google or Facebook
              account settings. You can revoke our access at any time:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>
                <strong>Google:</strong>{' '}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  Google Account → Third-party access
                </a>
              </li>
              <li>
                <strong>Facebook:</strong>{' '}
                <a
                  href="https://www.facebook.com/settings?tab=applications"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  Facebook → Settings → Apps and websites
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Related policies</h2>
            <p>
              For more on how we collect and use data, see our{' '}
              <Link href="/privacy" className={linkClass}>
                Privacy Policy
              </Link>
              . For other account questions, visit the{' '}
              <Link href="/faq" className={linkClass}>
                Help Center
              </Link>{' '}
              or{' '}
              <Link href="/contact" className={linkClass}>
                Customer service
              </Link>
              .
            </p>
          </section>

          <div className="text-sm text-gray-500 mt-8 pt-6 border-t">
            <p>Last updated: June 2026</p>
          </div>
        </div>
      </div>
    </div>
  )
}
