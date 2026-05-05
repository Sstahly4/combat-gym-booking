/**
 * Partner-facing agreement shown in onboarding Step 4 and embedded in the executed PDF.
 * Bump {@link CURRENT_PARTNER_AGREEMENT_VERSION} whenever this material changes so
 * owners who accepted an older version are prompted to re-accept.
 *
 * Full clause text lives in {@link AGREEMENT_SECTIONS} (see `partner-agreement-sections.ts`).
 */

import { AGREEMENT_SECTIONS } from './partner-agreement-sections'
import type { AgreementBlock, AgreementSection, AgreementSubsection } from './partner-agreement-types'

export type { AgreementBlock, AgreementSection, AgreementSubsection }

export { AGREEMENT_SECTIONS }

export const CURRENT_PARTNER_AGREEMENT_VERSION = '2026-04-v1'

export const AGREEMENT_META = {
  title: 'GYM PARTNER AGREEMENT',
  version: 'Version 1.0  |  April 2026',
  issuingParty: 'CombatStay Pty Ltd',
  abn: '33 279 676 778',
  governingLaw: 'Queensland, Australia',
  effectiveDate: 'Date of digital or wet-ink acceptance',
  website: 'www.combatstay.com',
  partnerEmail: 'partners@combatstay.com',
} as const

/** Shown next to the version chip in the UI (PDF header uses full {@link AGREEMENT_META}). */
export const PARTNER_AGREEMENT_EFFECTIVE_LABEL = AGREEMENT_META.version

export function getAgreementPlainText(): string {
  const lines: string[] = []

  for (const section of AGREEMENT_SECTIONS) {
    if (section.heading) lines.push(section.heading)

    const renderBlocks = (blocks: AgreementBlock[]) => {
      for (const block of blocks) {
        if (block.type === 'paragraph' || block.type === 'note') {
          lines.push(block.text)
        } else if (block.type === 'bullets') {
          block.items.forEach((item) => lines.push(`• ${item}`))
        } else if (block.type === 'table') {
          block.rows.forEach(([k, v]) => lines.push(`${k}: ${v}`))
        }
      }
    }

    if (section.body) renderBlocks(section.body)

    if (section.subsections) {
      for (const sub of section.subsections) {
        lines.push(sub.heading)
        renderBlocks(sub.body)
      }
    }
  }

  return lines.join('\n\n')
}

/** Full plain text for PDF generation (metadata + body). */
export function partnerAgreementPlainTextForPdf(): string {
  const header = [
    AGREEMENT_META.title,
    AGREEMENT_META.version,
    `${AGREEMENT_META.issuingParty} (ABN ${AGREEMENT_META.abn})`,
    `Governing law: ${AGREEMENT_META.governingLaw}`,
    `Website: ${AGREEMENT_META.website}`,
    `Partner contact: ${AGREEMENT_META.partnerEmail}`,
    `Agreement version ID: ${CURRENT_PARTNER_AGREEMENT_VERSION}`,
    '',
  ].join('\n')
  return `${header}\n${getAgreementPlainText()}\n`
}
