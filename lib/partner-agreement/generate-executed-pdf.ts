import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { PDFPage, PDFFont } from 'pdf-lib'

import {
  AGREEMENT_META,
  CURRENT_PARTNER_AGREEMENT_VERSION,
  getAgreementPlainText,
} from '@/lib/legal/partner-agreement-document'

export type ExecutedPartnerAgreementPdfInput = {
  signatoryName: string
  signatoryEmail: string
  gymName: string
  gymCountry: string | null
  signedAtIso: string
  clientIp: string | null
}

const PAGE_W = 595.28
const PAGE_H = 841.89
const MARGIN = 54
const FOOTER_BASELINE = 34
const FOOTER_RESERVED = 42
const BODY_SIZE = 9.5
const BODY_LEADING = 11.4
const TITLE_MAIN = 15
const BRAND_SIZE = 22
const MUTED = rgb(0.38, 0.4, 0.44)
const BODY = rgb(0.1, 0.11, 0.13)
const RULE = rgb(0.78, 0.8, 0.82)

function formatAcceptedUtc(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return (
    new Intl.DateTimeFormat('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    }).format(d) + ' UTC'
  )
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

function countBodyPages(bodyPlain: string, approxChars: number): number {
  const usableH = PAGE_H - MARGIN - FOOTER_RESERVED - MARGIN
  let y = usableH
  let pages = 1
  const lines = bodyPlain.split('\n')
  for (const raw of lines) {
    const trimmed = raw.trimEnd()
    if (!trimmed) {
      y -= 5
      continue
    }
    const isHeading =
      (/^\d+\.\s/.test(trimmed) || /^\d+\.\d+\s/.test(trimmed)) &&
      trimmed.length < 130 &&
      !trimmed.includes(': ') &&
      !trimmed.startsWith('•')
    const indent = trimmed.startsWith('•') ? 12 : 0
    const mc = approxChars - Math.floor(indent / 5)
    const wrapped = wrapLines(trimmed, mc)
    const lineLead = isHeading ? BODY_LEADING + 4 : BODY_LEADING
    for (const _ of wrapped) {
      if (y < MARGIN + FOOTER_RESERVED + lineLead) {
        pages++
        y = usableH
      }
      y -= lineLead
    }
    if (isHeading) y -= 2
  }
  return Math.max(1, pages)
}

function drawFooter(page: PDFPage, font: PDFFont, pageNum: number, totalPages: number) {
  const footer = `Confidential  |  ${AGREEMENT_META.issuingParty}  |  ABN: ${AGREEMENT_META.abn}  |  Page ${pageNum} of ${totalPages}`
  const fs = 8
  const w = font.widthOfTextAtSize(footer, fs)
  page.drawText(footer, {
    x: (PAGE_W - w) / 2,
    y: FOOTER_BASELINE,
    size: fs,
    font,
    color: MUTED,
  })
}

function drawHr(page: PDFPage, y: number) {
  page.drawLine({
    start: { x: MARGIN, y: y + 2 },
    end: { x: PAGE_W - MARGIN, y: y + 2 },
    thickness: 0.6,
    color: RULE,
  })
}

/**
 * Executed partner agreement PDF: branded cover, acceptance certificate (name,
 * UTC time, IP), then full agreement body — aligned with the issued Word layout.
 */
export async function generateExecutedPartnerAgreementPdf(
  input: ExecutedPartnerAgreementPdfInput,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.TimesRoman)
  const fontBold = await doc.embedFont(StandardFonts.TimesRomanBold)

  const agreementBody = getAgreementPlainText()
  const approxChars = Math.max(56, Math.floor((PAGE_W - MARGIN * 2) / (BODY_SIZE * 0.48)))
  const bodyIntro =
    'The following pages set out the binding Gym Partner Agreement as accepted above.'
  const bodyPages = countBodyPages(`${bodyIntro}\n\n${agreementBody}`, approxChars)
  const totalPages = 1 + bodyPages

  const drawCentered = (
    page: PDFPage,
    text: string,
    y: number,
    size: number,
    f: typeof font,
    color = BODY,
  ): number => {
    const w = f.widthOfTextAtSize(text, size)
    page.drawText(text, {
      x: (PAGE_W - w) / 2,
      y,
      size,
      font: f,
      color,
    })
    return y - size - 2
  }

  const drawLeft = (
    page: PDFPage,
    text: string,
    y: number,
    size: number,
    f: typeof font,
    color = BODY,
    x = MARGIN,
  ): number => {
    page.drawText(text, { x, y, size, font: f, color })
    return y - size - 1
  }

  const drawWrappedLeft = (
    page: PDFPage,
    text: string,
    y: number,
    size: number,
    opts?: { bold?: boolean; indent?: number },
  ): number => {
    const f = opts?.bold ? fontBold : font
    const indent = opts?.indent ?? 0
    const mc = Math.max(48, Math.floor((PAGE_W - MARGIN * 2 - indent) / (size * 0.48)))
    const lines = wrapLines(text, mc)
    let yy = y
    for (const line of lines) {
      if (yy < MARGIN + FOOTER_RESERVED + BODY_LEADING) return yy
      page.drawText(line, {
        x: MARGIN + indent,
        y: yy,
        size,
        font: f,
        color: BODY,
      })
      yy -= BODY_LEADING
    }
    return yy - 3
  }

  const drawCoverBlock = (page: PDFPage) => {
    let y = PAGE_H - MARGIN - 8
    y = drawCentered(page, AGREEMENT_META.brandWordmark, y, BRAND_SIZE, fontBold, BODY)
    y = drawCentered(page, AGREEMENT_META.website, y, 10, font, MUTED)
    y -= 18
    y = drawCentered(page, AGREEMENT_META.title, y, TITLE_MAIN, fontBold, BODY)
    y = drawCentered(page, AGREEMENT_META.version, y, 10, font, MUTED)
    y -= 14

    const metaRows: [string, string][] = [
      ['Issuing Party', `${AGREEMENT_META.issuingParty}  |  ABN: ${AGREEMENT_META.abn}`],
      ['Document Type', AGREEMENT_META.documentType],
      ['Governing Law', AGREEMENT_META.governingLaw],
      ['Effective Date', AGREEMENT_META.effectiveDate],
    ]
    for (const [label, value] of metaRows) {
      y = drawLeft(page, label, y, 8.5, fontBold, MUTED)
      y = drawWrappedLeft(page, value, y, 10)
      y -= 4
    }
    y -= 6
    drawHr(page, y)
    y -= 16

    y = drawCentered(page, 'ELECTRONIC ACCEPTANCE RECORD', y, 11, fontBold, BODY)
    y -= 10

    const certRows: [string, string][] = [
      ['Authorized signatory', input.signatoryName],
      ['Business email', input.signatoryEmail],
      ['Listing (property)', `${input.gymName}${input.gymCountry ? ` · ${input.gymCountry}` : ''}`],
      ['Accepted (UTC)', formatAcceptedUtc(input.signedAtIso)],
      ['Internet protocol (IP)', input.clientIp?.trim() || 'Not recorded'],
      ['Agreement record ID', CURRENT_PARTNER_AGREEMENT_VERSION],
    ]
    for (const [label, value] of certRows) {
      y = drawLeft(page, label.toUpperCase(), y, 7.5, fontBold, MUTED)
      y = drawWrappedLeft(page, value, y, 10.5)
      y -= 2
    }

    y -= 8
    drawHr(page, y)
    y -= 14
    y = drawCentered(page, 'FULL TEXT OF AGREEMENT', y, 11, fontBold, BODY)
    y -= 6
    return y
  }

  // —— Page 1: cover + certificate ——
  let page = doc.addPage([PAGE_W, PAGE_H])
  let pageNum = 1
  drawCoverBlock(page)
  drawFooter(page, font, pageNum, totalPages)

  // —— Agreement body from page 2 (clean pagination + footers) ——
  page = doc.addPage([PAGE_W, PAGE_H])
  pageNum = 2
  let y = PAGE_H - MARGIN
  y = drawLeft(page, bodyIntro, y, 10, font, MUTED)
  y -= 14

  const bodyLines = agreementBody.split('\n')
  for (const raw of bodyLines) {
    const line = raw.trimEnd()
    if (!line) {
      y -= 6
      continue
    }
    const isHeading =
      (/^\d+\.\s/.test(line) || /^\d+\.\d+\s/.test(line)) &&
      line.length < 130 &&
      !line.includes(': ') &&
      !line.startsWith('•')
    const size = isHeading ? 10.2 : BODY_SIZE
    const indent = line.startsWith('•') ? 12 : 0
    const wrapped = wrapLines(line, approxChars - Math.floor(indent / 5))
    const lineLead = isHeading ? BODY_LEADING + 4 : BODY_LEADING
    for (const wline of wrapped) {
      if (y < MARGIN + FOOTER_RESERVED + lineLead) {
        drawFooter(page, font, pageNum, totalPages)
        page = doc.addPage([PAGE_W, PAGE_H])
        pageNum++
        y = PAGE_H - MARGIN
      }
      page.drawText(wline, {
        x: MARGIN + indent,
        y,
        size,
        font: isHeading ? fontBold : font,
        color: BODY,
      })
      y -= lineLead
    }
    if (isHeading) y -= 2
  }

  drawFooter(page, font, pageNum, totalPages)

  return doc.save()
}
