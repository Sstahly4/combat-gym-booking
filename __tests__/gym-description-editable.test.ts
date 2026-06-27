import { describe, expect, it } from 'vitest'
import { gymDescriptionMarkdownToHtml } from '@/lib/text/gym-description-editable'

describe('gymDescriptionMarkdownToHtml', () => {
  it('renders bold and italic without showing markers', () => {
    const html = gymDescriptionMarkdownToHtml('Train with **elite coaches** and _friendly locals_.')
    expect(html).toContain('<strong>elite coaches</strong>')
    expect(html).toContain('<em>friendly locals</em>')
    expect(html).not.toContain('**')
    expect(html).not.toContain('_friendly')
  })

  it('preserves paragraph and line breaks', () => {
    const html = gymDescriptionMarkdownToHtml('Line one\nLine two\n\nSecond paragraph.')
    expect(html).toContain('<p>Line one<br>Line two</p>')
    expect(html).toContain('<p>Second paragraph.</p>')
  })

  it('escapes raw HTML in plain text', () => {
    const html = gymDescriptionMarkdownToHtml('Safe <script>alert(1)</script> text')
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>')
  })
})
