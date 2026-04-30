'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

const contactHref =
  '/contact?subject=Creator%20Program&message=Tell%20us%20about%20your%20audience%2C%20channels%2C%20and%20how%20you%27d%20like%20to%20work%20with%20CombatStay.'

// ─── Data ─────────────────────────────────────────────────────────────────────

const mosaicItems = [
  {
    label: 'Tiger Muay Thai, Phuket',
    tall: true,
    bg: 'linear-gradient(150deg, #064e3b 0%, #065f46 50%, #0d9488 100%)',
  },
  {
    label: 'Fairtex Training Center',
    tall: false,
    bg: 'linear-gradient(150deg, #7f1d1d 0%, #b91c1c 55%, #dc2626 100%)',
  },
  {
    label: 'Alliance BJJ, São Paulo',
    tall: false,
    bg: 'linear-gradient(150deg, #1e3a5f 0%, #1d4ed8 60%, #3b82f6 100%)',
  },
  {
    label: 'Krabi Training Camp',
    tall: false,
    bg: 'linear-gradient(150deg, #713f12 0%, #92400e 55%, #ca8a04 100%)',
  },
  {
    label: 'AKA Thailand, Phuket',
    tall: false,
    bg: 'linear-gradient(150deg, #134e4a 0%, #0f766e 55%, #0d9488 100%)',
  },
]

const forCards = [
  {
    title: 'Muay Thai creators',
    text: 'YouTube, TikTok, Instagram — your audience trusts your gym recommendations. Earn every time they book through your link.',
  },
  {
    title: 'Combat sports travellers',
    text: 'Already trained in Thailand? Share your experience, refer friends, and earn credits toward your next stay.',
  },
  {
    title: 'Coaches and fighters',
    text: 'Your students ask where to train abroad. Recommend CombatStay and earn on every booking that follows.',
  },
  {
    title: 'Travel bloggers',
    text: 'A CombatStay link in your gym review earns commission on every booking it drives — for 60 days from each click.',
  },
]

const steps = [
  {
    num: '01',
    title: 'Share your link',
    text: 'Apply and receive a unique tracking link. Share it in your content, bio, emails, or messages. Your 60-day cookie means you get credit even if someone takes two months to book.',
  },
  {
    num: '02',
    title: 'Someone books',
    text: 'A traveller clicks your link and completes a booking on CombatStay. They get a seamless experience. You get automatic attribution — no manual tracking required.',
  },
  {
    num: '03',
    title: 'You get paid',
    text: '30 days after their stay completes, your commission clears. Withdraw on demand when you hit $50, or let it auto-sweep on the 1st of each month. Zero deductions.',
  },
]

const t1Features = [
  'Unique tracking link, active immediately',
  '60-day referral window from click to booking',
  'On-demand withdrawals, $50 minimum',
  'Auto monthly sweep — no chasing required',
  'Zero deductions. Full amount, every time.',
]

const t2Features = [
  'Open to all verified CombatStay bookers',
  'Submit within 30 days of checkout',
  'Credits apply to any future booking',
  'Reviewed within 5 business days',
  '3 approved videos unlocks creator-code eligibility',
]

const payoutTerms = [
  ['30 days', 'Your commission clears 30 days after your referred traveller checks out — no 60–90 day delays.'],
  ['On demand', 'Withdraw whenever you hit $50. No waiting for monthly cycles.'],
  ['$0 deducted', 'We absorb all transfer fees. The amount in your dashboard is the amount that lands.'],
  ['60-day cookie', 'Double the standard referral window. Click today, book six weeks later — you still get credit.'],
]

const faqs = [
  {
    q: 'When exactly do I get paid?',
    a: 'Your commission clears 30 days after your referred traveller completes their stay. Once cleared, withdraw on demand any time you hit $50, or your full balance auto-sweeps to your account on the 1st of each month. No action required.',
  },
  {
    q: 'How does tracking work if someone books weeks after clicking?',
    a: 'Your referral cookie stays active for 60 days from the first click — double the industry standard. If someone clicks your link today and books six weeks later, you still get the commission. Attribution is last-click, which is the standard across all major affiliate platforms.',
  },
  {
    q: 'What counts as a completed booking?',
    a: 'A completed booking is one where the traveller checks out with no active dispute or chargeback. Cancelled bookings or disputes do not earn commission. You can track every referred booking status in your dashboard in real time.',
  },
  {
    q: 'Can I refer myself?',
    a: 'No. Self-referrals are automatically detected and commissions withheld. Our system flags same-device and same-IP referral attempts. This protects the program for every creator in it.',
  },
  {
    q: 'Do I need a website or minimum following to apply?',
    a: "No. CombatStay is open to anyone already helping people choose where to train — coaches, fighters, travellers, social creators, and bloggers alike. You apply, we review, and if you're a fit you're in.",
  },
  {
    q: 'What do I need to film for the content program?',
    a: "Show the gym, show real training, film horizontally, minimum 30 seconds, MP4. Gold-tier content earns $50 in booking credits. Silver earns $25. Bronze earns $10. You'll receive a decision within 5 business days.",
  },
  {
    q: 'Are there any fees deducted from my earnings?',
    a: 'None. CombatStay absorbs all transfer fees. The amount shown in your dashboard is the amount that lands in your account. No surprises at withdrawal.',
  },
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <div className="h-px bg-gray-200" />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-6 py-5 text-left"
      >
        <span className="text-base font-semibold leading-snug text-gray-900">{q}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <p className="pb-5 text-[15px] leading-relaxed text-gray-600">{a}</p>
      )}
    </div>
  )
}

function CheckItem({ text, muted }: { text: string; muted?: boolean }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <Check className="h-3 w-3 text-[#003580]" strokeWidth={2.5} />
      </span>
      <span className={`text-[14px] leading-relaxed ${muted ? 'text-gray-500' : 'text-gray-800'}`}>
        {text}
      </span>
    </li>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function CreatorProgramPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ── */}
      <section className="border-b border-gray-200">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-20">
          <div>
            <h1 className="text-[42px] font-extrabold leading-[1.05] tracking-tight text-gray-900 md:text-[60px]">
              Get paid to send fighters where they belong.
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-gray-600">
              Refer combat sports travellers to gyms and training camps on CombatStay.
              Built for fighters, coaches, travel creators, and anyone already helping
              people choose where to train.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={contactHref}
                className="inline-flex h-12 items-center justify-center rounded-md bg-[#006ce4] px-7 text-sm font-semibold text-white transition-colors hover:bg-[#0057b8]"
              >
                Apply to join
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex h-12 items-center px-2 text-sm font-medium text-gray-600 transition hover:text-gray-900"
              >
                See how it works →
              </a>
            </div>
          </div>

          {/* Earnings card — one dark section only */}
          <div className="rounded-2xl bg-[#003580] p-7 text-white">
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/50">
              Example month
            </p>
            <p className="mt-3 text-[64px] font-extrabold leading-none tracking-tight">
              $175
            </p>
            <p className="mt-2 text-[14px] text-white/55">
              5 completed bookings referred
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {(
                [
                  ['Payout timing', '30 days', 'after checkout'],
                  ['Referral window', '60 days', 'from click to booking'],
                  ['Withdrawals', 'On demand', '$50 minimum'],
                  ['Deductions', '$0', 'full cleared amount'],
                ] as [string, string, string][]
              ).map(([label, value, sub]) => (
                <div key={label} className="rounded-xl bg-white/[0.09] p-4">
                  <p className="text-[10px] uppercase tracking-[0.1em] text-white/40">
                    {label}
                  </p>
                  <p className="mt-1.5 text-[18px] font-extrabold">{value}</p>
                  <p className="mt-0.5 text-[11px] text-white/35">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Photo mosaic ── */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr',
            gridTemplateRows: '220px 220px',
            gap: '10px',
            borderRadius: '16px',
            overflow: 'hidden',
          }}
        >
          {mosaicItems.map((item, i) => (
            <div
              key={item.label}
              style={{
                background: item.bg,
                borderRadius: '6px',
                overflow: 'hidden',
                gridRow: i === 0 ? '1 / 3' : undefined,
                position: 'relative',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.025)'
                e.currentTarget.style.zIndex = '10'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.zIndex = '1'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'radial-gradient(ellipse at 25% 25%, rgba(255,255,255,0.08) 0%, transparent 65%)',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: '14px',
                  left: '14px',
                  background: 'rgba(0,0,0,0.42)',
                  backdropFilter: 'blur(8px)',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 500,
                  padding: '4px 11px',
                  borderRadius: '20px',
                }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section className="border-y border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-2 divide-x divide-gray-200 md:grid-cols-4">
            {(
              [
                ['30 days', 'Commission clears after checkout'],
                ['$0', 'Deducted on any withdrawal'],
                ['60 days', 'Referral window per click'],
                ['On demand', 'Withdraw your cleared balance'],
              ] as [string, string][]
            ).map(([stat, label]) => (
              <div key={stat} className="flex flex-col justify-center px-5 py-5 md:px-6">
                <p className="text-[22px] font-extrabold leading-none tracking-tight text-gray-900">
                  {stat}
                </p>
                <p className="mt-1.5 text-[13px] leading-snug text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
            You&rsquo;re already doing this. Now get paid for it.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500 md:text-lg">
            No minimum following. No website required. If you&rsquo;re already pointing people
            toward gyms and training camps, you belong here.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {forCards.map((card) => (
            <div
              key={card.title}
              className="rounded-xl border border-gray-200 bg-white p-5 md:p-6"
            >
              <h3 className="text-[16px] font-extrabold text-gray-900">{card.title}</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-gray-500">{card.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="border-y border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
              Three steps. No affiliate jargon.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-500 md:text-lg">
              Apply once. Share your link. Get paid when someone books. That&rsquo;s it.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.num}
                className="rounded-xl border border-gray-200 bg-white p-6"
              >
                <p className="text-[13px] font-semibold text-[#003580]">{step.num}</p>
                <h3 className="mt-5 text-[18px] font-extrabold text-gray-900">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-[14px] leading-relaxed text-gray-500">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Two tiers ── */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
            Two ways to earn. One program.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500 md:text-lg">
            Join as a referral partner, a content creator, or both.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* Tier 1 */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 md:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              Tier 1
            </p>
            <h3 className="mt-2 text-[22px] font-extrabold tracking-tight text-gray-900">
              Referral Partner
            </h3>
            <p className="mt-3 text-[14px] leading-relaxed text-gray-500">
              Share your unique link. Every time someone books through it, you earn a flat
              commission paid 30 days after they check out.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                { amount: '$25', label: '$200–500 stays', active: false },
                { amount: '$35', label: '$500–1k stays', active: true },
                { amount: '$50', label: '$1k+ stays', active: false },
              ].map((rate) => (
                <div
                  key={rate.amount}
                  className={`rounded-lg px-3.5 py-2 ${
                    rate.active
                      ? 'bg-[#003580] text-white'
                      : 'border border-gray-200 bg-gray-50 text-gray-800'
                  }`}
                >
                  <span className="text-[15px] font-bold">{rate.amount}</span>
                  <span
                    className={`ml-1.5 text-[12px] ${
                      rate.active ? 'text-white/70' : 'text-gray-500'
                    }`}
                  >
                    {rate.label}
                  </span>
                </div>
              ))}
            </div>
            <ul className="mt-6 space-y-3">
              {t1Features.map((item) => (
                <CheckItem key={item} text={item} />
              ))}
            </ul>
          </div>

          {/* Tier 2 — differentiated without going dark */}
          <div className="rounded-xl border border-[#003580]/20 bg-[#f0f6ff] p-6 md:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#003580]/60">
              Tier 2
            </p>
            <h3 className="mt-2 text-[22px] font-extrabold tracking-tight text-gray-900">
              Trip Creator
            </h3>
            <p className="mt-3 text-[14px] leading-relaxed text-gray-500">
              Already booked with us? Film your training experience and submit it. Every
              approved video earns booking credits toward your next stay — no follower count
              required.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                { amount: '$10', label: 'Bronze — testimonial', active: false },
                { amount: '$25', label: 'Silver — social ready', active: false },
                { amount: '$50', label: 'Gold — ad quality', active: true },
              ].map((rate) => (
                <div
                  key={rate.amount}
                  className={`rounded-lg px-3.5 py-2 ${
                    rate.active
                      ? 'bg-[#003580] text-white'
                      : 'border border-[#003580]/15 bg-white text-gray-800'
                  }`}
                >
                  <span className="text-[15px] font-bold">{rate.amount}</span>
                  <span
                    className={`ml-1.5 text-[12px] ${
                      rate.active ? 'text-white/70' : 'text-gray-500'
                    }`}
                  >
                    {rate.label}
                  </span>
                </div>
              ))}
            </div>
            <ul className="mt-6 space-y-3">
              {t2Features.map((item) => (
                <CheckItem key={item} text={item} />
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Creator code ── */}
      <section className="border-y border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <div className="grid gap-10 md:grid-cols-2 md:items-start md:gap-16">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                For top creators
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
                Unlock your own creator code.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-gray-500">
                Submit three approved videos and you become eligible for a personal creator
                code — giving your audience an exclusive discount and earning you a
                commission on every booking it drives.
              </p>
              <p className="mt-3 text-base leading-relaxed text-gray-500">
                This is how both tiers connect. Film your stay, earn credits, build a
                following, get a code, earn cash. The program compounds the more you put
                into it.
              </p>
            </div>

            {/* Clean stat list instead of heavy dark card */}
            <div className="space-y-4">
              {[
                ['Your personal code', 'Unique to you — shareable in bio, content, or messages'],
                ['Audience discount', 'Your followers get a real discount, not a gimmick'],
                ['Stacked commission', 'Earnings layer on top of your standard Tier 1 rate'],
                ['Full tracking', 'Code clicks and bookings tracked alongside your affiliate dashboard'],
              ].map(([title, desc]) => (
                <div
                  key={title}
                  className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <Check className="h-3 w-3 text-[#003580]" strokeWidth={2.5} />
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-gray-900">{title}</p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-gray-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Payout terms (no competitor callouts) ── */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
            Our payout terms, clearly.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500 md:text-lg">
            We believe creators should know exactly when and how they get paid, before
            they apply. So here it is.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {payoutTerms.map(([stat, desc]) => (
            <div
              key={stat}
              className="rounded-xl border border-gray-200 bg-white p-5 md:p-6"
            >
              <p className="text-[28px] font-extrabold leading-none tracking-tight text-[#003580]">
                {stat}
              </p>
              <p className="mt-3 text-[14px] leading-relaxed text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 py-14 md:py-20">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
            Your questions answered.
          </h2>
          <div className="mt-10">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
            <div className="h-px bg-gray-200" />
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="mx-auto max-w-3xl px-4 py-16 text-center md:py-24">
        <h2 className="text-[38px] font-extrabold leading-[1.05] tracking-tight text-gray-900 md:text-[52px]">
          Ready to earn from the gyms you already love?
        </h2>
        <p className="mx-auto mt-5 max-w-md text-[17px] leading-relaxed text-gray-500">
          Join the CombatStay creator program. Takes two minutes to apply and we review
          every application personally.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href={contactHref}
            className="inline-flex h-12 items-center justify-center rounded-md bg-[#006ce4] px-8 text-sm font-semibold text-white transition-colors hover:bg-[#0057b8]"
          >
            Apply to join
          </Link>
          <Link
            href="/auth/signin"
            className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            Already a creator? Sign in
          </Link>
        </div>
        <p className="mt-6 text-[13px] text-gray-400">
          Free to join · No minimum following · Payouts in 30 days
        </p>
      </section>
    </div>
  )
}
