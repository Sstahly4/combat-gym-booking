export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
}

const COMMON_PASSWORD_FRAGMENTS = [
  'password',
  '123456',
  'qwerty',
  'letmein',
  'welcome',
  'combatbooking',
]

export function validatePasswordRules(password: string): PasswordValidationResult {
  const errors: string[] = []

  if (password.length < 10) {
    errors.push('Password must be at least 10 characters')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must include at least one number')
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must include at least one symbol')
  }

  const lowered = password.toLowerCase()
  if (COMMON_PASSWORD_FRAGMENTS.some((fragment) => lowered.includes(fragment))) {
    errors.push('Password uses a common pattern and is not allowed')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
