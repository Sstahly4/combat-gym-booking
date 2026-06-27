'use client'

import { useMemo } from 'react'
import { ShieldAlert } from 'lucide-react'
import { assessPasswordStrength } from '@/lib/auth/password-rules'

interface PasswordEasilyGuessedNoticeProps {
  password?: string
  className?: string
}

/**
 * Contextual “easily guessed password” callout — industry term used by NIST /
 * OWASP. Only renders once the user has typed something that fails the soft
 * guessability check (Airbnb-style: advise, don’t bury in a long checklist).
 */
export function PasswordEasilyGuessedNotice({
  password = '',
  className,
}: PasswordEasilyGuessedNoticeProps) {
  const assessment = useMemo(() => assessPasswordStrength(password), [password])

  if (!password || !assessment.meetsRequirements || !assessment.easilyGuessed) {
    return null
  }

  return (
    <div
      role="status"
      className={
        className ??
        'rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50 to-orange-50/80 px-4 py-3.5 shadow-sm'
      }
    >
      <div className="flex gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
          <ShieldAlert className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-amber-950">
            This password is easy to guess
          </p>
          <p className="text-sm leading-snug text-amber-900/85">
            Choose something harder to guess — avoid common words and simple patterns
            like Password1!
          </p>
          {assessment.easilyGuessedReasons.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs leading-snug text-amber-900/75">
              {assessment.easilyGuessedReasons.map((reason) => (
                <li key={reason} className="flex gap-2">
                  <span aria-hidden className="text-amber-600">
                    •
                  </span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
