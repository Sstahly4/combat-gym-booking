import { describe, expect, it } from 'vitest'
import {
  assessPasswordStrength,
  isWordsPlusDigitsPattern,
  passwordUsesCommonPattern,
  validatePasswordRules,
} from '@/lib/auth/password-rules'

describe('validatePasswordRules (Airbnb-style)', () => {
  it('accepts a strong gym-specific password', () => {
    const result = validatePasswordRules('SiamTraining2026!')
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('accepts 8+ chars with a number only', () => {
    expect(validatePasswordRules('abc1defg').valid).toBe(true)
  })

  it('accepts 8+ chars with a symbol only', () => {
    expect(validatePasswordRules('longpass!').valid).toBe(true)
  })

  it('rejects short passwords', () => {
    const result = validatePasswordRules('Sh0rt!')
    expect(result.valid).toBe(false)
    expect(result.errors.join(' ')).toMatch(/at least 8/i)
  })

  it('requires a number or symbol', () => {
    expect(validatePasswordRules('abcdefgh').valid).toBe(false)
  })

  it('rejects easily guessed passwords like Password1!', () => {
    const result = validatePasswordRules('Password1!')
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => /harder to guess/i.test(e))).toBe(true)
  })
})

describe('assessPasswordStrength', () => {
  it('flags common words separately from minimum requirements', () => {
    const result = assessPasswordStrength('Welcome123!')
    expect(result.meetsRequirements).toBe(true)
    expect(result.easilyGuessed).toBe(true)
  })

  it('does not flag long gym-specific passwords', () => {
    const result = assessPasswordStrength('SiamTraining2026!')
    expect(result.meetsRequirements).toBe(true)
    expect(result.easilyGuessed).toBe(false)
  })
})

describe('isWordsPlusDigitsPattern', () => {
  it('matches Password1! and dog1', () => {
    expect(isWordsPlusDigitsPattern('Password1!')).toBe(true)
    expect(isWordsPlusDigitsPattern('dog1')).toBe(true)
  })

  it('does not match mixed complex passwords', () => {
    expect(isWordsPlusDigitsPattern('SiamTraining2026!')).toBe(false)
  })
})

describe('passwordUsesCommonPattern', () => {
  it('detects welcome and password fragments', () => {
    expect(passwordUsesCommonPattern('Welcome123!')).toBe(true)
    expect(passwordUsesCommonPattern('myPassword1!')).toBe(true)
  })
})
