import Link from 'next/link'

type Props = { searchParams: { session_id?: string } }

export default function SamplesConnectSuccessPage({ searchParams }: Props) {
  const sessionId = searchParams.session_id

  return (
    <div className="min-h-screen bg-[#f4f6f9] px-4 py-10 md:px-8">
      <div className="mx-auto max-w-lg rounded-xl border border-gray-200/90 bg-white p-8 shadow-md">
        <h1 className="text-lg font-semibold text-[#003580]">Payment complete</h1>
        <p className="mt-2 text-sm text-gray-600">
          Thank you. This sample used a destination charge with an application fee to the platform.
        </p>
        {sessionId ? (
          <p className="mt-4 font-mono text-xs text-gray-500 break-all">
            Checkout session: {sessionId}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/samples/connect/store"
            className="inline-flex rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
          >
            Back to store
          </Link>
          <Link
            href="/samples/connect"
            className="inline-flex rounded-lg bg-[#003580] px-4 py-2 text-sm font-medium text-white hover:bg-[#002a66]"
          >
            Sample hub
          </Link>
        </div>
      </div>
    </div>
  )
}
