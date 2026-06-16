import { describe, expect, it } from 'vitest'
import {
  htmlToStructuredPlainTextRegex,
  normalizePlainTextPaste,
  structuredTextFromClipboard,
} from '@/lib/text/rich-paste'

describe('htmlToStructuredPlainTextRegex', () => {
  it('preserves paragraph breaks from HTML blocks', () => {
    const html = '<p>First paragraph.</p><p>Second paragraph.</p>'
    expect(htmlToStructuredPlainTextRegex(html)).toBe('First paragraph.\n\nSecond paragraph.')
  })

  it('converts headings to bold markers', () => {
    const html = '<h2>Training schedule</h2><p>Morning and evening sessions.</p>'
    expect(htmlToStructuredPlainTextRegex(html)).toContain('**Training schedule**')
    expect(htmlToStructuredPlainTextRegex(html)).toContain('Morning and evening sessions.')
  })

  it('converts line breaks and list items', () => {
    const html = '<p>Line one<br>Line two</p><ul><li>Pads</li><li>Sparring</li></ul>'
    const out = htmlToStructuredPlainTextRegex(html)
    expect(out).toContain('Line one\nLine two')
    expect(out).toContain('- Pads')
    expect(out).toContain('- Sparring')
  })
})

describe('normalizePlainTextPaste', () => {
  it('normalizes Windows line endings and extra blank lines', () => {
    expect(normalizePlainTextPaste('Para one\r\n\r\n\r\nPara two')).toBe('Para one\n\nPara two')
  })
})

describe('structuredTextFromClipboard', () => {
  it('prefers HTML when available', () => {
    const out = structuredTextFromClipboard(
      '<p>Hello</p><p>World</p>',
      'HelloWorld',
    )
    expect(out).toBe('Hello\n\nWorld')
  })
})
