/**
 * Single source of truth for how we DISPLAY the password standards to users.
 * The actual validation lives in lib/auth/password-rules.ts — if you change the
 * rules there, update PASSWORD_STANDARDS below to match.
 */

import { AlertCircle } from 'lucide-react'

export const PASSWORD_STANDARDS: readonly string[] = [
  'At least 10 characters',
  'At least one number',
  'At least one symbol (e.g. ! @ # $)',
  'Avoid common patterns (password, 123456, qwerty, …)',
]

interface PasswordStandardsHintProps {
  errors?: string[] | null
  className?: string
  /** When true, render errors inline below the list. Defaults to true. */
  showErrors?: boolean
}

export function PasswordStandardsHint({
  errors,
  className,
  showErrors = true,
}: PasswordStandardsHintProps) {
  return (
    <div className={className}>
      <p className="text-xs font-medium text-gray-700">Password must have:</p>
      <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-gray-500">
        {PASSWORD_STANDARDS.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
      {showErrors && errors && errors.length > 0 && (
        <div className="mt-2 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-2.5 py-2 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <ul className="list-inside list-disc space-y-0.5">
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
