import 'server-only'

import fs from 'node:fs'
import path from 'node:path'

/** Latin WOFF from @fontsource/inter (OFL); required for executed agreement PDF. */
const INTER_FILES = {
  regular: 'inter-latin-400-normal.woff',
  bold: 'inter-latin-700-normal.woff',
  italic: 'inter-latin-400-italic.woff',
  boldItalic: 'inter-latin-700-italic.woff',
} as const

export type InterFontBytes = Record<keyof typeof INTER_FILES, Uint8Array>

export function readInterFontBytesForPdf(): InterFontBytes {
  const dir = path.join(process.cwd(), 'node_modules/@fontsource/inter/files')
  const out = {} as InterFontBytes
  for (const key of Object.keys(INTER_FILES) as (keyof typeof INTER_FILES)[]) {
    const name = INTER_FILES[key]
    const full = path.join(dir, name)
    if (!fs.existsSync(full)) {
      throw new Error(
        `Partner agreement PDF: missing font "${name}" under @fontsource/inter. Run pnpm install.`,
      )
    }
    out[key] = new Uint8Array(fs.readFileSync(full))
  }
  return out
}
