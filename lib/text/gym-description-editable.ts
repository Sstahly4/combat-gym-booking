/**
 * Convert gym description markdown (stored format) to HTML for contenteditable editing,
 * and serialize edited HTML back to markdown for storage.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function inlineMarkdownToHtml(line: string): string {
  const parts = line.split(/(\*\*[^*]+\*\*|_[^_]+_)/g)
  return parts
    .filter((part) => part.length > 0)
    .map((part) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return `<strong>${escapeHtml(part.slice(2, -2))}</strong>`
      }
      if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
        return `<em>${escapeHtml(part.slice(1, -1))}</em>`
      }
      return escapeHtml(part)
    })
    .join('')
}

export function gymDescriptionMarkdownToHtml(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return ''

  const paragraphs = text.split(/\n{2,}/)
  return paragraphs
    .map((paragraph) => {
      const lines = paragraph.split('\n')
      const inner = lines.map(inlineMarkdownToHtml).join('<br>')
      return `<p>${inner || '<br>'}</p>`
    })
    .join('')
}

function collapseBlankLines(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd()
}

function isEmptyBlock(el: HTMLElement): boolean {
  const text = el.textContent ?? ''
  if (!text.replace(/\u00a0/g, ' ').trim()) return true
  const html = el.innerHTML.toLowerCase()
  return html === '<br>' || html === '<br/>' || html === '<br />'
}

function serializeInlineNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? '').replace(/\u00a0/g, ' ')
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return ''

  const el = node as HTMLElement
  const tag = el.tagName.toLowerCase()
  const children = Array.from(el.childNodes).map(serializeInlineNode).join('')

  if (tag === 'br') return '\n'
  if (tag === 'strong' || tag === 'b') {
    return children ? `**${children}**` : ''
  }
  if (tag === 'em' || tag === 'i') {
    return children ? `_${children}_` : ''
  }

  return children
}

function serializeBlockElement(el: HTMLElement): string {
  if (isEmptyBlock(el)) return ''
  return Array.from(el.childNodes).map(serializeInlineNode).join('')
}

export function gymDescriptionElementToMarkdown(root: HTMLElement): string {
  const blocks: string[] = []

  for (const child of Array.from(root.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = (child.textContent ?? '').replace(/\u00a0/g, ' ').trim()
      if (text) blocks.push(text)
      continue
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue

    const el = child as HTMLElement
    const tag = el.tagName.toLowerCase()

    if (tag === 'p' || tag === 'div') {
      const block = serializeBlockElement(el)
      blocks.push(block)
      continue
    }

    if (tag === 'br') continue

    const inline = serializeInlineNode(child).trim()
    if (inline) blocks.push(inline)
  }

  return collapseBlankLines(blocks.join('\n\n'))
}

export function gymDescriptionHtmlToMarkdown(html: string): string {
  const trimmed = html.trim()
  if (!trimmed) return ''

  if (typeof DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(trimmed, 'text/html')
      return gymDescriptionElementToMarkdown(doc.body)
    } catch {
      // fall through
    }
  }

  return ''
}
