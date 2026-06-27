'use client'

/**
 * Lightweight Airbnb-style password guidance — minimum bar only.
 * Guessability feedback lives in PasswordEasilyGuessedNotice.
 */

import { Check } from 'lucide-react'
import { PASSWORD_MIN_LENGTH, assessPasswordStrength } from '@/lib/auth/password-rules'

const LIVE_RULES = [
  {
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    check: (p: string) => p.length >= PASSWORD_MIN_LENGTH,
  },
  {
    label: 'Includes a number or symbol',
    check: (p: string) => /[0-9]/.test(p) || /[^A-Za-z0-9]/.test(p),
  },
]

interface PasswordStandardsHintProps {
  password?: string
  className?: string
}

export function PasswordStandardsHint({
  password = '',
  className,
}: PasswordStandardsHintProps) {
  const hasInput = password.length > 0
  const { meetsRequirements } = assessPasswordStrength(password)

  return (
    <div className={className}>
      <p className="text-xs text-stone-500">
        Use at least {PASSWORD_MIN_LENGTH} characters with a number or symbol — longer is better.
      </p>
      {hasInput && (
        <ul className="mt-2 space-y-1.5">
          {LIVE_RULES.map((rule) => {
            const passed = rule.check(password)
            return (
              <li key={rule.label} className="flex items-center gap-2.5">
                {passed ? (
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-500">
                    <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} aria-hidden />
                  </span>
                ) : (
                  <span className="h-4 w-4 shrink-0 rounded-full border-2 border-stone-300" />
                )}
                <span
                  className={`text-xs leading-snug ${
                    passed ? 'font-medium text-green-700' : 'text-stone-500'
                  }`}
                >
                  {rule.label}
                </span>
              </li>
            )
          })}
        </ul>
      )}
      {hasInput && meetsRequirements && (
        <p className="mt-2 text-xs text-stone-400">
          Tip: mix letters, numbers, and symbols — and avoid names or common words.
        </p>
      )}
    </div>
  )
}

export const PASSWORD_STANDARDS = [
  `At least ${PASSWORD_MIN_LENGTH} characters`,
  'Includes a number or symbol',
]
