/**
 * Convert pasted HTML (Word, Google Docs, websites) into plain text that keeps
 * paragraphs, line breaks, lists, and light emphasis markers for the gym profile.
 */

const BLOCK_TAGS = new Set([
  'p',
  'div',
  'section',
  'article',
  'header',
  'footer',
  'main',
  'blockquote',
])

const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

function collapseBlankLines(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd()
}

function wrapBold(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('**') && trimmed.endsWith('**')) return trimmed
  return `**${trimmed}**`
}

function wrapItalic(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('_') && trimmed.endsWith('_')) return trimmed
  return `_${trimmed}_`
}

/** Regex fallback for unit tests and non-DOM environments. */
export function htmlToStructuredPlainTextRegex(html: string): string {
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<h[1-6][^>]*>/gi, '\n\n**')
    .replace(/<\/h[1-6]>/gi, '**\n\n')
    .replace(/<(strong|b)[^>]*>/gi, '**')
    .replace(/<\/(strong|b)>/gi, '**')
    .replace(/<(em|i)[^>]*>/gi, '_')
    .replace(/<\/(em|i)>/gi, '_')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/(p|div|section|article|blockquote)>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")

  return collapseBlankLines(text)
}

function serializeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? ''
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return ''

  const el = node as HTMLElement
  const tag = el.tagName.toLowerCase()

  if (tag === 'script' || tag === 'style') return ''

  const children = Array.from(el.childNodes).map(serializeNode).join('')

  if (tag === 'br') return '\n'

  if (HEADING_TAGS.has(tag)) {
    const title = children.trim()
    return title ? `\n\n${wrapBold(title)}\n\n` : '\n'
  }

  if (tag === 'strong' || tag === 'b') {
    const inner = children.trim()
    return inner ? wrapBold(inner) : children
  }

  if (tag === 'em' || tag === 'i') {
    const inner = children.trim()
    return inner ? wrapItalic(inner) : children
  }

  if (tag === 'li') {
    const item = children.trim()
    return item ? `\n- ${item}` : ''
  }

  if (tag === 'ul' || tag === 'ol') {
    const list = children.trim()
    return list ? `\n${list}\n` : ''
  }

  if (BLOCK_TAGS.has(tag)) {
    const block = children.trimEnd()
    return block ? `${block}\n\n` : '\n'
  }

  return children
}

export function htmlToStructuredPlainText(html: string): string {
  const trimmed = html.trim()
  if (!trimmed) return ''

  if (typeof DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(trimmed, 'text/html')
      const bodyText = serializeNode(doc.body)
      if (bodyText.trim()) return collapseBlankLines(bodyText)
    } catch {
      // fall through to regex
    }
  }

  return htmlToStructuredPlainTextRegex(trimmed)
}

/** Normalize plain-text pastes (PDF, Notes) without destroying intentional spacing. */
export function normalizePlainTextPaste(text: string): string {
  return collapseBlankLines(text.replace(/\r\n/g, '\n'))
}

export function structuredTextFromClipboard(html: string, plain: string): string {
  if (html.trim()) return htmlToStructuredPlainText(html)
  return normalizePlainTextPaste(plain)
}

export function insertTextAtSelection(
  textarea: HTMLTextAreaElement,
  insert: string,
): string {
  const start = textarea.selectionStart ?? textarea.value.length
  const end = textarea.selectionEnd ?? textarea.value.length
  const next = `${textarea.value.slice(0, start)}${insert}${textarea.value.slice(end)}`
  const valueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    'value',
  )?.set
  if (valueSetter) {
    valueSetter.call(textarea, next)
  } else {
    textarea.value = next
  }
  const caret = start + insert.length
  textarea.setSelectionRange(caret, caret)
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
  return next
}
