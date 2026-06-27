export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
}

/** Minimum length aligned with common consumer travel apps (e.g. Airbnb ~8). */
export const PASSWORD_MIN_LENGTH = 8

const COMMON_PASSWORD_FRAGMENTS = [
  'password',
  '123456',
  'qwerty',
  'letmein',
  'welcome',
  'combatstay',
]

export interface PasswordStrengthAssessment {
  /** Hard minimum bar — length plus a number or symbol. */
  meetsRequirements: boolean
  requirementErrors: string[]
  /** Soft check — common / guessable patterns (Airbnb-style guidance). */
  easilyGuessed: boolean
  easilyGuessedReasons: string[]
}

export function passwordUsesCommonPattern(password: string): boolean {
  if (!password) return false
  const lowered = password.toLowerCase()
  return COMMON_PASSWORD_FRAGMENTS.some((fragment) => lowered.includes(fragment))
}

/** Airbnb warns against short “word + digits” combos (e.g. dog1, Password1!). */
export function isWordsPlusDigitsPattern(password: string): boolean {
  if (!password) return false
  return /^[A-Za-z]{3,10}\d{1,4}[^A-Za-z0-9]?$/.test(password)
}

export function assessPasswordStrength(password: string): PasswordStrengthAssessment {
  const requirementErrors: string[] = []

  if (password.length < PASSWORD_MIN_LENGTH) {
    requirementErrors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  }

  const hasNumber = /[0-9]/.test(password)
  const hasSymbol = /[^A-Za-z0-9]/.test(password)
  if (password.length > 0 && !hasNumber && !hasSymbol) {
    requirementErrors.push('Add a number or symbol to make your password stronger')
  }

  const easilyGuessedReasons: string[] = []
  if (password.length > 0 && passwordUsesCommonPattern(password)) {
    easilyGuessedReasons.push('Avoid common words like “password”, “welcome”, or “123456”.')
  }
  if (password.length > 0 && isWordsPlusDigitsPattern(password)) {
    easilyGuessedReasons.push(
      'Avoid simple word-and-number combinations (for example, Password1! or dog1).',
    )
  }

  return {
    meetsRequirements: requirementErrors.length === 0,
    requirementErrors,
    easilyGuessed: easilyGuessedReasons.length > 0,
    easilyGuessedReasons,
  }
}

/** Server + client gate for saving a new password. */
export function validatePasswordRules(password: string): PasswordValidationResult {
  const assessment = assessPasswordStrength(password)
  const errors = [...assessment.requirementErrors]

  if (assessment.easilyGuessed) {
    errors.push('Choose a password that is harder to guess')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
