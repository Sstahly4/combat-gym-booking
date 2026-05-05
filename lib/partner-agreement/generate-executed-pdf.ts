import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

import {
  AGREEMENT_META,
  CURRENT_PARTNER_AGREEMENT_VERSION,
  PARTNER_AGREEMENT_EFFECTIVE_LABEL,
  partnerAgreementPlainTextForPdf,
} from '@/lib/legal/partner-agreement-document'

export type ExecutedPartnerAgreementPdfInput = {
  signatoryName: string
  signatoryEmail: string
  gymName: string
  gymCountry: string | null
  signedAtIso: string
  clientIp: string | null
}

function wrapLines(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    if (!w) continue
    const next = cur ? `${cur} ${w}` : w
    if (next.length <= maxChars) {
      cur = next
    } else {
      if (cur) lines.push(cur)
      cur = w.length > maxChars ? w.slice(0, maxChars) : w
    }
  }
  if (cur) lines.push(cur)
  return lines
}

/**
 * Returns PDF bytes for an executed partner agreement (acceptance record + full agreement text).
 */
export async function generateExecutedPartnerAgreementPdf(
  input: ExecutedPartnerAgreementPdfInput,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const pageMargin = 50
  const fontSize = 10
  const titleSize = 14
  const lineHeight = 13
  const pageWidth = 595.28
  const pageHeight = 841.89
  const maxW = pageWidth - pageMargin * 2

  let page = doc.addPage([pageWidth, pageHeight])
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)

  let y = pageHeight - pageMargin

  const drawLine = (text: string, opts?: { bold?: boolean; size?: number }) => {
    const size = opts?.size ?? fontSize
    const f = opts?.bold ? fontBold : font
    if (y < pageMargin + 48) {
      page = doc.addPage([pageWidth, pageHeight])
      y = pageHeight - pageMargin
    }
    page.drawText(text, {
      x: pageMargin,
      y,
      size,
      font: f,
      color: rgb(0.12, 0.14, 0.18),
    })
    y -= lineHeight
  }

  const drawWrapped = (text: string, opts?: { bold?: boolean; size?: number }) => {
    const size = opts?.size ?? fontSize
    const approxChars = Math.max(52, Math.floor(maxW / (size * 0.52)))
    const lines = wrapLines(text, approxChars)
    for (const line of lines) {
      drawLine(line, opts)
    }
    y -= 4
  }

  drawLine(`${AGREEMENT_META.title} — executed copy`, { bold: true, size: titleSize })
  y -= 4
  drawWrapped(
    `Version ${CURRENT_PARTNER_AGREEMENT_VERSION} · Effective ${PARTNER_AGREEMENT_EFFECTIVE_LABEL}`,
    { size: 9 },
  )
  drawLine('Acceptance record', { bold: true, size: 11 })
  drawWrapped(`Legal signatory: ${input.signatoryName}`)
  drawWrapped(`Account email: ${input.signatoryEmail}`)
  drawWrapped(`Property (listing): ${input.gymName}${input.gymCountry ? ` · ${input.gymCountry}` : ''}`)
  drawWrapped(`Accepted at (UTC): ${input.signedAtIso}`)
  drawWrapped(`Client IP (best-effort): ${input.clientIp || 'Not recorded'}`)
  y -= 8
  drawLine('Agreement text', { bold: true, size: 11 })
  y -= 4

  const agreementBody = partnerAgreementPlainTextForPdf()
  const bodyLines = agreementBody.split('\n')
  for (const raw of bodyLines) {
    const line = raw.trimEnd()
    if (!line) {
      y -= 6
      continue
    }
    const isHeading =
      (/^\d+\.\s/.test(line) || /^\d+\.\d+\s/.test(line)) && line.length < 120 && !line.includes(': ')
    drawWrapped(line, isHeading ? { bold: true, size: 10 } : { size: 9 })
  }

  return doc.save()
}
