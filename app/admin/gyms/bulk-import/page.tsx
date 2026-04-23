'use client'

/**
 * Admin → bulk import draft gyms from CSV (preview → duplicate review → commit).
 *
 * Auth guard: `AdminLayoutShell` in `app/admin/layout.tsx`.
 */
import { useCallback, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { parseXlsxBufferToCsvText } from '@/lib/admin/bulk-gym-import-xlsx'
import type {
  BulkImportParsedRow,
  BulkImportRowResolution,
  BulkGymDuplicateGym,
} from '@/lib/admin/bulk-gym-import'

interface PreviewStats {
  total: number
  with_errors: number
  with_duplicates: number
  ready: number
}

function defaultResolutions(rows: BulkImportParsedRow[]): Record<number, BulkImportRowResolution> {
  const m: Record<number, BulkImportRowResolution> = {}
  for (const r of rows) {
    if (r.errors.length > 0) continue
    if (r.duplicate_matches.length > 0) continue
    m[r.rowIndex] = { row_index: r.rowIndex, action: 'create' }
  }
  return m
}

function gymBlock(label: string, row: BulkImportParsedRow | BulkGymDuplicateGym, isCsv: boolean) {
  const name = 'sports_raw' in row ? row.name : row.name
  const city = row.city
  const country = row.country
  const maps = 'sports_raw' in row ? row.google_maps_link : row.google_maps_link
  const addr = row.address?.trim() ? row.address : null
  const disc = row.disciplines?.join(', ') || '—'
  const sportsRaw = 'sports_raw' in row ? row.sports_raw : null
  const ver = 'verification_status' in row && !('sports_raw' in row) ? row.verification_status : null

  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50/80 p-4 text-left">
      {label ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p>
      ) : null}
      <dl className="space-y-1.5 text-sm text-stone-800">
        <div>
          <dt className="text-xs text-stone-500">Name</dt>
          <dd className="font-medium">{name || '—'}</dd>
        </div>
        {addr ? (
          <div>
            <dt className="text-xs text-stone-500">Address</dt>
            <dd className="text-xs">{addr}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs text-stone-500">City / country</dt>
          <dd>
            {city}, {country}
          </dd>
        </div>
        {'offers_accommodation' in row && row.offers_accommodation ? (
          <div>
            <dt className="text-xs text-stone-500">Accommodation</dt>
            <dd className="text-xs">Yes (from sheet)</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs text-stone-500">Google Maps</dt>
          <dd className="break-all text-xs">{maps || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-stone-500">Disciplines</dt>
          <dd>{disc}</dd>
        </div>
        {isCsv && sportsRaw ? (
          <div>
            <dt className="text-xs text-stone-500">Raw sports cell</dt>
            <dd className="text-xs">{sportsRaw}</dd>
          </div>
        ) : null}
        {ver ? (
          <div>
            <dt className="text-xs text-stone-500">Verification</dt>
            <dd className="text-xs">{ver}</dd>
          </div>
        ) : null}
        {!isCsv && 'id' in row ? (
          <div>
            <dt className="text-xs text-stone-500">Gym ID</dt>
            <dd className="font-mono text-xs">{row.id}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  )
}

export default function AdminBulkGymImportPage() {
  const [csvText, setCsvText] = useState('')
  const [defaultCountry, setDefaultCountry] = useState('Thailand')
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [loadingCommit, setLoadingCommit] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<BulkImportParsedRow[] | null>(null)
  const [stats, setStats] = useState<PreviewStats | null>(null)
  const [batchId, setBatchId] = useState<string | null>(null)
  const [resolutions, setResolutions] = useState<Record<number, BulkImportRowResolution>>({})
  const [commitSummary, setCommitSummary] = useState<Record<string, unknown> | null>(null)
  const [modalRow, setModalRow] = useState<BulkImportParsedRow | null>(null)
  const [selectedExistingId, setSelectedExistingId] = useState<string | null>(null)
  const [loadedFileLabel, setLoadedFileLabel] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [parsingFile, setParsingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
    setError(null)
    const lower = file.name.toLowerCase()
    setParsingFile(true)
    try {
      if (lower.endsWith('.csv')) {
        const t = await file.text()
        setCsvText(t)
        setLoadedFileLabel(file.name)
        return
      }
      if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
        const buf = await file.arrayBuffer()
        const csv = await parseXlsxBufferToCsvText(buf)
        setCsvText(csv)
        setLoadedFileLabel(file.name)
        return
      }
      setError('Please use a .csv, .xlsx, or .xls file.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that file.')
    } finally {
      setParsingFile(false)
    }
  }, [])

  const openDuplicateModal = useCallback((row: BulkImportParsedRow) => {
    setModalRow(row)
    setSelectedExistingId(row.duplicate_matches[0]?.gym.id ?? null)
  }, [])

  const closeModal = useCallback(() => {
    setModalRow(null)
    setSelectedExistingId(null)
  }, [])

  const runPreview = useCallback(async () => {
    setError(null)
    setCommitSummary(null)
    setLoadingPreview(true)
    try {
      const res = await fetch('/api/admin/gyms/bulk-import/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csv_text: csvText,
          default_country: defaultCountry.trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `Preview failed (${res.status})`)
      const nextRows = data.rows as BulkImportParsedRow[]
      setRows(nextRows)
      setStats(data.stats as PreviewStats)
      setBatchId(crypto.randomUUID())
      setResolutions(defaultResolutions(nextRows))
    } catch (e) {
      setRows(null)
      setStats(null)
      setBatchId(null)
      setResolutions({})
      setError(e instanceof Error ? e.message : 'Preview failed')
    } finally {
      setLoadingPreview(false)
    }
  }, [csvText, defaultCountry])

  const allResolved = useMemo(() => {
    if (!rows?.length) return false
    if (rows.some((r) => r.errors.length > 0)) return false
    return rows.every((r) => Boolean(resolutions[r.rowIndex]))
  }, [rows, resolutions])

  const runCommit = useCallback(async () => {
    if (!rows?.length || !batchId) return
    setError(null)
    setLoadingCommit(true)
    try {
      const list = rows.map((r) => resolutions[r.rowIndex]).filter(Boolean) as BulkImportRowResolution[]
      const res = await fetch('/api/admin/gyms/bulk-import/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: batchId,
          csv_text: csvText,
          default_country: defaultCountry.trim(),
          resolutions: list,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `Commit failed (${res.status})`)
      if (data.already_committed) {
        setCommitSummary((data.summary as Record<string, unknown>) ?? null)
        setError(null)
      } else {
        setCommitSummary((data.summary as Record<string, unknown>) ?? null)
        setRows(null)
        setStats(null)
        setBatchId(null)
        setResolutions({})
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Commit failed')
    } finally {
      setLoadingCommit(false)
    }
  }, [rows, batchId, csvText, defaultCountry, resolutions])

  const setResolution = useCallback((rowIndex: number, next: BulkImportRowResolution) => {
    setResolutions((prev) => ({ ...prev, [rowIndex]: next }))
  }, [])

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Admin · Gyms</p>
        <h1 className="mt-1 text-2xl font-semibold text-stone-900">Bulk import (CSV or Excel)</h1>
        <p className="mt-2 max-w-3xl text-sm text-stone-600">
          Drag in a <span className="font-medium">.xlsx</span> / <span className="font-medium">.xls</span> file (first
          sheet only) or paste CSV text. A title row above the column headers (for example a sheet banner) is
          detected automatically. Prospect-style columns work:{' '}
          <span className="font-medium">name</span>, <span className="font-medium">address</span>,{' '}
          <span className="font-medium">city</span>, <span className="font-medium">sports</span>,{' '}
          <span className="font-medium">accommodation</span> (Yes/No → listing flag), plus optional maps URL and{' '}
          <span className="font-medium">country</span> or the default below. Extra columns (rating, phone, website,
          …) are ignored. A Python <span className="font-mono text-xs">all_gyms=[...]</span> list is not supported —
          export to Excel or CSV first.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="outline" size="sm" asChild className="rounded-full">
            <Link href="/admin/gyms">← All gyms</Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-full">
            <Link href="/admin/orphan-gyms">Claim links</Link>
          </Button>
        </div>
      </header>

      {error && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      {commitSummary && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-950">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">Import finished</p>
            <pre className="mt-2 max-h-48 overflow-auto rounded bg-white/80 p-2 text-xs">
              {JSON.stringify(commitSummary, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileSpreadsheet className="h-5 w-5 text-stone-600" aria-hidden />
              Spreadsheet
            </CardTitle>
            <CardDescription>
              First row must be column headers. Excel uses the first worksheet only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              aria-label="Choose CSV or Excel file"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void processFile(f)
                e.target.value = ''
              }}
            />
            <button
              type="button"
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'copy'
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                const f = e.dataTransfer.files?.[0]
                if (f) void processFile(f)
              }}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center text-sm transition-colors',
                dragOver
                  ? 'border-[#003580] bg-blue-50/60 text-stone-900'
                  : 'border-stone-200 bg-stone-50/50 text-stone-600 hover:border-stone-300 hover:bg-stone-50',
              )}
            >
              {parsingFile ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  Reading file…
                </span>
              ) : (
                <>
                  <span className="font-medium text-stone-800">Drop a file here or click to browse</span>
                  <span className="mt-1 text-xs text-stone-500">.csv, .xlsx, or .xls</span>
                  {loadedFileLabel ? (
                    <span className="mt-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-stone-700 shadow-sm">
                      Loaded: {loadedFileLabel}
                    </span>
                  ) : null}
                </>
              )}
            </button>
            <textarea
              className="min-h-[220px] w-full rounded-md border border-stone-200 bg-white px-3 py-2 font-mono text-xs text-stone-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
              placeholder={`name,city,country,google_maps_link,disciplines\nExample Gym,Bangkok,Thailand,https://maps.google.com/?place_id=...,MMA, BJJ`}
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value)
                setLoadedFileLabel(null)
              }}
              spellCheck={false}
            />
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1">
                <label htmlFor="default-country" className="text-xs font-medium text-stone-600">
                  Default country (when the country cell is blank)
                </label>
                <input
                  id="default-country"
                  className="w-56 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
                  value={defaultCountry}
                  onChange={(e) => setDefaultCountry(e.target.value)}
                />
              </div>
              <Button
                type="button"
                onClick={runPreview}
                disabled={loadingPreview || parsingFile || !csvText.trim()}
              >
                {loadingPreview ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    Preview…
                  </>
                ) : (
                  'Run preview'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-stone-600">
            <ol className="list-decimal space-y-2 pl-4">
              <li>Run preview — parse errors show in the table.</li>
              <li>Resolve duplicates — open each flagged row and choose skip, update, or add anyway.</li>
              <li>Commit — uses a batch id so double-clicks do not duplicate.</li>
            </ol>
            {stats && (
              <div className="rounded-md border border-stone-100 bg-stone-50 px-3 py-2 text-xs text-stone-700">
                <p>
                  Rows: <span className="font-semibold">{stats.total}</span>
                </p>
                <p>
                  Parse errors: <span className="font-semibold">{stats.with_errors}</span>
                </p>
                <p>
                  Duplicate warnings: <span className="font-semibold">{stats.with_duplicates}</span>
                </p>
                <p>
                  Ready to create as-is: <span className="font-semibold">{stats.ready}</span>
                </p>
              </div>
            )}
            <Button
              type="button"
              className="w-full"
              disabled={!allResolved || loadingCommit || !batchId}
              onClick={runCommit}
            >
              {loadingCommit ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Committing…
                </>
              ) : (
                'Commit import'
              )}
            </Button>
            {!batchId && rows && <p className="text-xs text-amber-800">Run preview again to get a fresh batch id.</p>}
          </CardContent>
        </Card>
      </div>

      {rows && rows.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Preview</CardTitle>
            <CardDescription>Row # matches your spreadsheet (header is row 1).</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-xs uppercase text-stone-500">
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">City</th>
                  <th className="py-2 pr-3">Country</th>
                  <th className="py-2 pr-3">Maps</th>
                  <th className="py-2 pr-3">Sports</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const res = resolutions[r.rowIndex]
                  const dup = r.duplicate_matches.length > 0
                  const err = r.errors.length > 0
                  return (
                    <tr key={r.rowIndex} className="border-b border-stone-100">
                      <td className="py-2 pr-3 font-mono text-xs text-stone-500">{r.rowIndex}</td>
                      <td className="py-2 pr-3 font-medium text-stone-900">{r.name}</td>
                      <td className="py-2 pr-3">{r.city}</td>
                      <td className="py-2 pr-3">{r.country}</td>
                      <td className="max-w-[140px] truncate py-2 pr-3 text-xs text-stone-600">
                        {r.google_maps_link || '—'}
                      </td>
                      <td className="py-2 pr-3 text-xs">{r.disciplines.join(', ')}</td>
                      <td className="py-2 pr-3">
                        {err ? (
                          <span className="text-red-700">{r.errors.join(' · ')}</span>
                        ) : dup ? (
                          <span className="text-amber-800">Duplicate ({r.duplicate_matches[0]?.tier})</span>
                        ) : (
                          <span className="text-emerald-800">OK</span>
                        )}
                      </td>
                      <td className="py-2">
                        {err ? (
                          <span className="text-xs text-stone-400">—</span>
                        ) : dup ? (
                          <div className="flex flex-col gap-1">
                            <Button type="button" variant="outline" size="sm" onClick={() => openDuplicateModal(r)}>
                              Review duplicate…
                            </Button>
                            {res ? (
                              <span className="text-xs text-stone-600">
                                {res.action === 'skip' && 'Skip'}
                                {res.action === 'update' && `Update ${res.existing_gym_id?.slice(0, 8)}…`}
                                {res.action === 'create_anyway' && 'Add new anyway'}
                              </span>
                            ) : (
                              <span className="text-xs text-amber-800">Needs choice</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-stone-500">Create draft</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={Boolean(modalRow)} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent className="max-w-4xl">
          {modalRow && (
            <>
              <DialogHeader>
                <DialogTitle>Possible duplicate — row {modalRow.rowIndex}</DialogTitle>
                <DialogDescription>
                  Compare the spreadsheet row with the existing gym. Updating overwrites name, address, city, country,
                  Google Maps link, disciplines, and the accommodation flag on the existing listing.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {gymBlock('From spreadsheet (new)', modalRow, true)}
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Existing gym (database)</p>
                  {modalRow.duplicate_matches.length > 1 ? (
                    <div className="space-y-2">
                      {modalRow.duplicate_matches.map(({ gym }) => (
                        <label
                          key={gym.id}
                          className={cn(
                            'flex cursor-pointer gap-2 rounded-lg border p-3 text-sm',
                            selectedExistingId === gym.id
                              ? 'border-[#003580] bg-blue-50/50'
                              : 'border-stone-200 bg-stone-50/50',
                          )}
                        >
                          <input
                            type="radio"
                            name="dupPick"
                            className="mt-1"
                            checked={selectedExistingId === gym.id}
                            onChange={() => setSelectedExistingId(gym.id)}
                          />
                          <div className="min-w-0 flex-1">{gymBlock('', gym, false)}</div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    modalRow.duplicate_matches[0] && gymBlock('Matched listing', modalRow.duplicate_matches[0].gym, false)
                  )}
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-2 border-t border-stone-100 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setResolution(modalRow.rowIndex, { row_index: modalRow.rowIndex, action: 'skip' })
                    closeModal()
                  }}
                >
                  Do not import this row
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    const id =
                      modalRow.duplicate_matches.length === 1
                        ? modalRow.duplicate_matches[0].gym.id
                        : selectedExistingId
                    if (!id) return
                    setResolution(modalRow.rowIndex, {
                      row_index: modalRow.rowIndex,
                      action: 'update',
                      existing_gym_id: id,
                    })
                    closeModal()
                  }}
                >
                  Replace / update existing gym
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setResolution(modalRow.rowIndex, {
                      row_index: modalRow.rowIndex,
                      action: 'create_anyway',
                    })
                    closeModal()
                  }}
                >
                  Keep spreadsheet row as a new gym
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
