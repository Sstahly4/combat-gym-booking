import type { ReactNode } from 'react'

/**
 * Render gym description stored as plain text with:
 * - blank lines → paragraphs
 * - single newlines → line breaks within a paragraph
 * - **bold** → <strong>
 */
export function renderGymDescriptionText(text: string): ReactNode[] {
  const paragraphs = text.split(/\n{2,}/)

  return paragraphs.map((paragraph, paragraphIndex) => {
    const lines = paragraph.split('\n')
    return (
      <p key={paragraphIndex} className="whitespace-pre-wrap">
        {lines.map((line, lineIndex) => (
          <span key={lineIndex}>
            {lineIndex > 0 ? <br /> : null}
            {renderInlineEmphasis(line)}
          </span>
        ))}
      </p>
    )
  })
}

function renderInlineEmphasis(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts
    .filter((part) => part.length > 0)
    .map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong key={index} className="font-semibold text-gray-900">
            {part.slice(2, -2)}
          </strong>
        )
      }
      return part
    })
}
