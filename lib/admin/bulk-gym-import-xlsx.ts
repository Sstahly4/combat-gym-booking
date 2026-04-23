/**
 * Read the first worksheet of an .xlsx file into a string grid, then CSV text
 * for the existing bulk-import pipeline. Kept separate so `xlsx` loads only
 * when this path is used (dynamic import).
 */
import { coerceGridToStrings, gridToCsv } from '@/lib/admin/bulk-gym-import'

export async function parseXlsxBufferToGrid(buffer: ArrayBuffer): Promise<string[][]> {
  const XLSX = await import('xlsx')
  const wb = XLSX.read(buffer, { type: 'array' })
  const sheetName = wb.SheetNames[0]
  if (!sheetName) {
    throw new Error('This workbook has no sheets.')
  }
  const sheet = wb.Sheets[sheetName]
  if (!sheet) {
    throw new Error('Could not read the first worksheet.')
  }
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  }) as unknown[][]
  const grid = coerceGridToStrings(raw)
  while (grid.length && grid[grid.length - 1].every((c) => c.trim() === '')) {
    grid.pop()
  }
  if (grid.length < 2) {
    throw new Error('The first sheet needs a header row and at least one data row.')
  }
  return grid
}

export async function parseXlsxBufferToCsvText(buffer: ArrayBuffer): Promise<string> {
  const grid = await parseXlsxBufferToGrid(buffer)
  return gridToCsv(grid)
}
