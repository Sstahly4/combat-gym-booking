import Link from 'next/link'
import { Shield, Stethoscope, Snowflake, BadgeCheck } from 'lucide-react'

export function GuideLogisticsBlocks({ cityLabel = 'Thailand' }: { cityLabel?: string }) {
  return (
    <div className="mt-8 grid gap-6 md:grid-cols-2">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-[#003580]/10 p-2 text-[#003580]">
            <BadgeCheck className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Legality &amp; visas (don’t wing this)</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              Longer training stays often trigger visa questions. Use official sources, plan early, and treat “visa help” as a
              convenience — not a guarantee.
            </p>
            <div className="mt-3 space-y-1 text-sm">
              <Link href="/blog/thailand-training-visa-dtv" className="font-semibold text-[#003580] underline">
                Thailand Training Visa / DTV guide
              </Link>
              <div>
                <Link href="/blog/ed-visa-martial-arts-training-thailand" className="font-semibold text-[#003580] underline">
                  ED visa for martial arts training (and alternatives)
                </Link>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Practical tip: if a gym lists <strong>“Visa / stay guidance”</strong> on its profile, confirm exactly what they
              can and can’t help with.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-[#003580]/10 p-2 text-[#003580]">
            <Snowflake className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recovery signals to look for</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              Travelers don’t just want “cheap training” — they want outcomes. Recovery facilities are often the difference
              between training twice a day and burning out.
            </p>
            <ul className="mt-3 space-y-1 text-sm text-gray-700">
              <li>
                <strong>Ice bath / cold plunge</strong> + <strong>sauna</strong> (volume sustainability)
              </li>
              <li>
                <strong>Physio / sports therapy</strong> (injury prevention and return-to-training)
              </li>
              <li>
                <strong>Massage</strong> + <strong>yoga / mobility</strong> (joint + tissue load management)
              </li>
            </ul>
            <p className="mt-3 text-xs text-gray-500">
              When you shortlist gyms in {cityLabel}, check each profile’s amenities — these are structured fields, not vague
              marketing copy.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-[#003580]/10 p-2 text-[#003580]">
            <Stethoscope className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Medical &amp; injury planning</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              If you’re training hard, assume you’ll deal with something: shin splints, shoulder irritation, cuts, or rib
              bruising. Plan a “minimum viable” recovery setup before you arrive.
            </p>
            <p className="mt-3 text-xs text-gray-500">
              For fight-camp intensity, prioritize gyms that mention <strong>first aid</strong> and/or <strong>physio</strong>{' '}
              on their listing.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-[#003580]/10 p-2 text-[#003580]">
            <Shield className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">What “verified/trusted” actually means</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              CombatStay ranks guides from live listings. Verified/trusted status is a quality signal for profiles and helps
              avoid stale, scraped lists.
            </p>
            <p className="mt-3 text-xs text-gray-500">
              If a gym is missing from this guide, it may not have a live listing yet.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

