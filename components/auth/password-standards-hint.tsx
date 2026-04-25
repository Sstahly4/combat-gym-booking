'use client'

/**
 * Real-time per-rule password strength indicator.
 *
 * Pass `password` to show live pass/fail per rule as the user types.
 * Pass `errors` (from a submit attempt) to flip failing rules red.
 */

import { Check, X } from 'lucide-react'

const LIVE_RULES = [
  {
    label: 'At least 10 characters',
    check: (p: string) => p.length >= 10,
  },
  {
    label: 'At least one number',
    check: (p: string) => /[0-9]/.test(p),
  },
  {
    label: 'At least one symbol (e.g. ! @ # $)',
    check: (p: string) => /[^A-Za-z0-9]/.test(p),
  },
]

interface PasswordStandardsHintProps {
  /** Current password value — drives live per-rule status icons. */
  password?: string
  /** Errors returned from a submit attempt (validatePasswordRules). */
  errors?: string[] | null
  className?: string
}

export function PasswordStandardsHint({
  password = '',
  errors,
  className,
}: PasswordStandardsHintProps) {
  const hasInput = password.length > 0
  const submitAttempted = Boolean(errors && errors.length > 0)

  // Any error that doesn't correspond to one of the 3 live rules (i.e. "common pattern")
  const extraErrors = submitAttempted
    ? (errors ?? []).filter(
        (e) =>
          !e.toLowerCase().includes('10 characters') &&
          !e.toLowerCase().includes('one number') &&
          !e.toLowerCase().includes('one symbol'),
      )
    : []

  return (
    <div className={className}>
      <ul className="space-y-1.5">
        {LIVE_RULES.map((rule) => {
          const passed = rule.check(password)
          // Only show red X if user has submitted and this rule fails
          const failed = submitAttempted && !passed

          return (
            <li key={rule.label} className="flex items-center gap-2.5">
              {/* Status dot */}
              {passed ? (
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-500">
                  <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} aria-hidden />
                </span>
              ) : failed ? (
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500">
                  <X className="h-2.5 w-2.5 text-white" strokeWidth={3} aria-hidden />
                </span>
              ) : (
                <span
                  className={`h-4 w-4 shrink-0 rounded-full border-2 ${
                    hasInput ? 'border-gray-400' : 'border-gray-300'
                  }`}
                />
              )}

              {/* Label */}
              <span
                className={`text-xs leading-snug ${
                  passed
                    ? 'text-green-700 font-medium'
                    : failed
                    ? 'text-red-600'
                    : 'text-gray-500'
                }`}
              >
                {rule.label}
              </span>
            </li>
          )
        })}
      </ul>

      {/* "Common pattern" error — not a live-checkable rule, show inline */}
      {extraErrors.map((err) => (
        <p key={err} className="mt-2 text-xs text-red-600">
          {err}
        </p>
      ))}
    </div>
  )
}

// Keep old named export for any stray imports
export const PASSWORD_STANDARDS = [
  'At least 10 characters',
  'At least one number',
  'At least one symbol (e.g. ! @ # $)',
]
