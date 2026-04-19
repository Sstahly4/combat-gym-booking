import { describe, expect, it } from 'vitest'
import { validatePasswordRules } from '@/lib/auth/password-rules'

describe('validatePasswordRules', () => {
  it('accepts a sufficiently strong password', () => {
    const result = validatePasswordRules('Str0ng!Phrase42')
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('rejects short passwords', () => {
    const result = validatePasswordRules('Sh0rt!')
    expect(result.valid).toBe(false)
    expect(result.errors.join(' ')).toMatch(/at least 10/i)
  })

  it('requires a number', () => {
    expect(validatePasswordRules('NoNumbersHere!').valid).toBe(false)
  })

  it('requires a symbol', () => {
    expect(validatePasswordRules('NoSymbolsHere1').valid).toBe(false)
  })

  it('rejects common patterns', () => {
    const result = validatePasswordRules('myPassword1!aaa')
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => /common pattern/i.test(e))).toBe(true)
  })
})
