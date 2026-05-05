import fontkit from '@pdf-lib/fontkit'
import { PDFDocument, rgb } from 'pdf-lib'
import type { PDFPage, PDFFont } from 'pdf-lib'

import {
  AGREEMENT_META,
  CURRENT_PARTNER_AGREEMENT_VERSION,
  getAgreementPlainText,
} from '@/lib/legal/partner-agreement-document'
import { readInterFontBytesForPdf } from '@/lib/partner-agreement/load-inter-fonts-for-pdf'

export type ExecutedPartnerAgreementPdfInput = {
  signatoryName: string
  signatoryEmail: string
  gymName: string
  gymCountry: string | null
  signedAtIso: string
  clientIp: string | null
}

/** A4 points; margin ≈ Word default 2.54 cm (72 pt). */
const PAGE_W = 595.28
const PAGE_H = 841.89
const MARGIN = 72
const FOOTER_BASELINE = 34
const FOOTER_RESERVED = 48
const BODY_TOP_OFFSET = 10

/** Issued Word template palette. */
const NAVY = rgb(26 / 255, 58 / 255, 92 / 255) // #1a3a5c
const HEADER_URL = rgb(170 / 255, 204 / 255, 238 / 255) // #aaccee
const MUTED = rgb(102 / 255, 102 / 255, 102 / 255) // #666666
const BODY = rgb(17 / 255, 17 / 255, 17 / 255) // #111111
const RULE = rgb(0.88, 0.9, 0.93)
const PANEL_FILL = rgb(0.97, 0.98, 0.99)
const BANNER_H = 76

/** Word Normal ≈ 11 pt; line ~1.22×. */
const BODY_SIZE = 11
const BODY_LEADING = 13.6
/** Word Heading 1 / 2 style (half‑points 30 / 24 → 15 / 12 pt). */
const H1_SIZE = 15
const H1_LEADING = 18
const H2_SIZE = 12
const H2_LEADING = 14.6

function leadForWrappedLine(size: number): number {
  return Math.max(size * 1.22, size + 2.4)
}

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

function approxCharsPerLine(font: PDFFont, size: number, contentWidth: number): number {
  const sample =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,; '
  const w = font.widthOfTextAtSize(sample, size)
  const avg = w / sample.length
  return Math.max(42, Math.floor(contentWidth / avg))
}

type BodyLineKind = 'body' | 'h1' | 'h2'

function classifyBodyLine(trimmed: string): BodyLineKind {
  if (!trimmed || trimmed.startsWith('•')) return 'body'
  const isShort = trimmed.length < 130 && !trimmed.includes(': ')
  if (!isShort) return 'body'
  if (/^\d+\.\d+\s/.test(trimmed)) return 'h2'
  if (/^\d+\.\s/.test(trimmed) && !/^\d+\.\d/.test(trimmed)) return 'h1'
  return 'body'
}

function lineMetrics(kind: BodyLineKind, isBullet: boolean): { size: number; lead: number; spaceBefore: number } {
  if (kind === 'h1') {
    return { size: H1_SIZE, lead: H1_LEADING, spaceBefore: 12 }
  }
  if (kind === 'h2') {
    return { size: H2_SIZE, lead: H2_LEADING, spaceBefore: 10 }
  }
  return { size: BODY_SIZE, lead: BODY_LEADING, spaceBefore: isBullet ? 0 : 0 }
}

function trailingAfterHeading(kind: BodyLineKind): number {
  if (kind === 'h1') return 6
  if (kind === 'h2') return 4
  return 0
}

function countBodyPages(agreementPlain: string, approxChars: number): number {
  const usableH = PAGE_H - MARGIN - FOOTER_RESERVED - MARGIN - BODY_TOP_OFFSET
  let y = usableH - BODY_LEADING - 16
  let pages = 1
  let prevKind: BodyLineKind = 'body'

  const newPage = () => {
    pages++
    y = usableH
  }

  if (y < MARGIN + FOOTER_RESERVED) {
    newPage()
  }

  const ensureVertical = (need: number) => {
    if (y - need < MARGIN + FOOTER_RESERVED) {
      newPage()
    }
  }

  const lines = agreementPlain.split('\n')
  for (const raw of lines) {
    const trimmed = raw.trimEnd()
    if (!trimmed) {
      y -= 6
      continue
    }
    const kind = classifyBodyLine(trimmed)
    const indent = trimmed.startsWith('•') ? 12 : 0
    const mc = approxChars - Math.floor(indent / 4)
    const wrapped = wrapLines(trimmed, mc)
    const bullet = trimmed.startsWith('•')
    const { size, lead, spaceBefore } = lineMetrics(kind, bullet)

    if (kind === 'h1' || kind === 'h2') {
      const needBefore = prevKind === 'body' || prevKind === 'h1' || prevKind === 'h2' ? spaceBefore : 0
      const blockH = needBefore + wrapped.length * lead + trailingAfterHeading(kind)
      ensureVertical(blockH)
      if (needBefore) y -= needBefore
      for (const _ of wrapped) {
        if (y < MARGIN + FOOTER_RESERVED + lead) {
          newPage()
        }
        y -= lead
      }
      y -= trailingAfterHeading(kind)
      prevKind = kind
      continue
    }

    for (const _ of wrapped) {
      if (y < MARGIN + FOOTER_RESERVED + lead) {
        newPage()
      }
      y -= lead
    }
    prevKind = kind
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

function drawHr(page: PDFPage, y: number, color = RULE) {
  page.drawLine({
    start: { x: MARGIN, y: y + 2 },
    end: { x: PAGE_W - MARGIN, y: y + 2 },
    thickness: 0.75,
    color,
  })
}

function drawBodyPageAccent(page: PDFPage) {
  page.drawLine({
    start: { x: MARGIN, y: PAGE_H - MARGIN + 2 },
    end: { x: PAGE_W - MARGIN, y: PAGE_H - MARGIN + 2 },
    thickness: 3,
    color: NAVY,
  })
}

/**
 * Executed partner agreement PDF: Inter (embedded), Word‑like margins & heading
 * breaks, navy cover band, acceptance panel, full body.
 */
export async function generateExecutedPartnerAgreementPdf(
  input: ExecutedPartnerAgreementPdfInput,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)

  const bytes = readInterFontBytesForPdf()
  const font = await doc.embedFont(bytes.regular, { subset: true })
  const fontBold = await doc.embedFont(bytes.bold, { subset: true })
  const fontOblique = await doc.embedFont(bytes.italic, { subset: true })
  const fontBoldOblique = await doc.embedFont(bytes.boldItalic, { subset: true })

  const contentWidth = PAGE_W - 2 * MARGIN
  const approxChars = approxCharsPerLine(font, BODY_SIZE, contentWidth)

  const agreementBody = getAgreementPlainText()
  const bodyIntro =
    'The following pages set out the binding Gym Partner Agreement as accepted above.'
  const bodyPages = countBodyPages(agreementBody, approxChars)
  const totalPages = 1 + bodyPages

  const drawCentered = (
    page: PDFPage,
    text: string,
    y: number,
    size: number,
    f: PDFFont,
    color = BODY,
  ): number => {
    const tw = f.widthOfTextAtSize(text, size)
    page.drawText(text, {
      x: (PAGE_W - tw) / 2,
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
    f: PDFFont,
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
    opts?: { bold?: boolean; oblique?: boolean; color?: ReturnType<typeof rgb> },
  ): number => {
    const f =
      opts?.bold && opts?.oblique
        ? fontBoldOblique
        : opts?.bold
          ? fontBold
          : opts?.oblique
            ? fontOblique
            : font
    const c = opts?.color ?? BODY
    const lineLead = leadForWrappedLine(size)
    const mc = approxCharsPerLine(f, size, contentWidth)
    const lines = wrapLines(text, mc)
    let yy = y
    for (const line of lines) {
      if (yy < MARGIN + FOOTER_RESERVED + lineLead) return yy
      page.drawText(line, {
        x: MARGIN,
        y: yy,
        size,
        font: f,
        color: c,
      })
      yy -= lineLead
    }
    return yy - 3
  }

  let page = doc.addPage([PAGE_W, PAGE_H])
  let pageNum = 1

  const certRows: [string, string][] = [
    ['Authorized signatory', input.signatoryName],
    ['Business email', input.signatoryEmail],
    ['Listing (property)', `${input.gymName}${input.gymCountry ? ` · ${input.gymCountry}` : ''}`],
    ['Accepted (UTC)', formatAcceptedUtc(input.signedAtIso)],
    ['Internet protocol (IP)', input.clientIp?.trim() || 'Not recorded'],
    ['Agreement record ID', CURRENT_PARTNER_AGREEMENT_VERSION],
  ]

  const drawCoverPage1 = () => {
    const bannerBottom = PAGE_H - MARGIN - BANNER_H
    page.drawRectangle({
      x: MARGIN,
      y: bannerBottom,
      width: PAGE_W - 2 * MARGIN,
      height: BANNER_H,
      color: NAVY,
    })

    const combat = 'COMBAT'
    const stay = 'STAY'
    const wmSize = 26
    const combatW = fontBold.widthOfTextAtSize(combat, wmSize)
    const stayW = fontBold.widthOfTextAtSize(stay, wmSize)
    const gap = 2
    const totalW = combatW + gap + stayW
    let tx = (PAGE_W - totalW) / 2
    const bannerMidY = bannerBottom + BANNER_H * 0.62
    page.drawText(combat, {
      x: tx,
      y: bannerMidY,
      size: wmSize,
      font: fontBold,
      color: rgb(1, 1, 1),
    })
    tx += combatW + gap
    page.drawText(stay, {
      x: tx,
      y: bannerMidY,
      size: wmSize,
      font: fontBold,
      color: rgb(1, 1, 1),
    })

    const urlSize = 10
    const url = AGREEMENT_META.website
    const urlW = fontOblique.widthOfTextAtSize(url, urlSize)
    page.drawText(url, {
      x: (PAGE_W - urlW) / 2,
      y: bannerBottom + BANNER_H * 0.22,
      size: urlSize,
      font: fontOblique,
      color: HEADER_URL,
    })

    let y = bannerBottom - 28
    y = drawCentered(page, AGREEMENT_META.title, y, 26, fontBold, NAVY)
    y = drawCentered(page, AGREEMENT_META.version, y, 11, font, MUTED)
    y -= 18

    const metaRows: [string, string][] = [
      ['Issuing Party', `${AGREEMENT_META.issuingParty}  |  ABN: ${AGREEMENT_META.abn}`],
      ['Document Type', AGREEMENT_META.documentType],
      ['Governing Law', AGREEMENT_META.governingLaw],
      ['Effective Date', AGREEMENT_META.effectiveDate],
    ]
    for (const [label, value] of metaRows) {
      y = drawLeft(page, label, y, 8, fontBold, MUTED)
      y = drawWrappedLeft(page, value, y, 10, { bold: false })
      y -= 6
    }
    y -= 4
    drawHr(page, y)
    y -= 20

    y = drawCentered(page, 'ELECTRONIC ACCEPTANCE RECORD', y, 11, fontBold, NAVY)
    y -= 14

    const certTopInner = y + 4
    let certCursor = y
    for (const [label, value] of certRows) {
      certCursor = drawLeft(page, label.toUpperCase(), certCursor, 7.2, fontBold, MUTED)
      certCursor = drawWrappedLeft(page, value, certCursor, 10)
      certCursor -= 4
    }
    const certBottomInner = certCursor - 8
    const certH = certTopInner - certBottomInner
    page.drawRectangle({
      x: MARGIN - 2,
      y: certBottomInner,
      width: PAGE_W - 2 * MARGIN + 4,
      height: certH,
      color: PANEL_FILL,
      borderColor: RULE,
      borderWidth: 0.9,
    })

    certCursor = certTopInner
    for (const [label, value] of certRows) {
      certCursor = drawLeft(page, label.toUpperCase(), certCursor, 7.2, fontBold, MUTED)
      certCursor = drawWrappedLeft(page, value, certCursor, 10)
      certCursor -= 4
    }
    y = certCursor - 6

    y -= 8
    drawHr(page, y)
    y -= 14
    drawCentered(page, 'FULL TEXT OF AGREEMENT', y, 11, fontBold, NAVY)
  }

  drawCoverPage1()
  drawFooter(page, font, pageNum, totalPages)

  page = doc.addPage([PAGE_W, PAGE_H])
  pageNum = 2
  drawBodyPageAccent(page)
  const usableTop = PAGE_H - MARGIN - BODY_TOP_OFFSET
  let y = usableTop

  const startBodyPage = () => {
    drawFooter(page, font, pageNum, totalPages)
    page = doc.addPage([PAGE_W, PAGE_H])
    pageNum++
    drawBodyPageAccent(page)
    y = usableTop
  }

  const ensureSpace = (need: number) => {
    if (y - need < MARGIN + FOOTER_RESERVED) {
      startBodyPage()
    }
  }

  page.drawText(bodyIntro, {
    x: MARGIN,
    y,
    size: BODY_SIZE,
    font: fontOblique,
    color: MUTED,
  })
  y -= BODY_LEADING + 16

  const bodyLines = agreementBody.split('\n')
  let prevKind: BodyLineKind = 'body'
  for (const raw of bodyLines) {
    const line = raw.trimEnd()
    if (!line) {
      y -= 6
      continue
    }
    const kind = classifyBodyLine(line)
    const bullet = line.startsWith('•')
    const { size, lead, spaceBefore } = lineMetrics(kind, bullet)
    const indent = bullet ? 12 : 0
    const wrapped = wrapLines(line, approxChars - Math.floor(indent / 4))

    if (kind === 'h1' || kind === 'h2') {
      const needBefore = prevKind === 'body' || prevKind === 'h1' || prevKind === 'h2' ? spaceBefore : 0
      const blockH = needBefore + wrapped.length * lead + trailingAfterHeading(kind)
      ensureSpace(blockH)
      if (needBefore) y -= needBefore
      const textFont = fontBold
      for (const wline of wrapped) {
        if (y < MARGIN + FOOTER_RESERVED + lead) {
          startBodyPage()
        }
        page.drawText(wline, {
          x: MARGIN + indent,
          y,
          size,
          font: textFont,
          color: NAVY,
        })
        y -= lead
      }
      y -= trailingAfterHeading(kind)
      prevKind = kind
      continue
    }

    const textFont = font
    for (const wline of wrapped) {
      if (y < MARGIN + FOOTER_RESERVED + lead) {
        startBodyPage()
      }
      page.drawText(wline, {
        x: MARGIN + indent,
        y,
        size,
        font: textFont,
        color: BODY,
      })
      y -= lead
    }
    prevKind = kind
  }

  drawFooter(page, font, pageNum, totalPages)

  return doc.save()
}
