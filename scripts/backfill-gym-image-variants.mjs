/**
 * Backfill gym_images.variants (w400/w800/w1200 WebP, thumbhash, EXIF-stripped originals).
 *
 * Paths + JSONB keys must match lib/images/gym-image-variants.ts uploadGymImageWithVariants().
 *
 * Prerequisites (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   pnpm run backfill:gym-image-variants -- --dry-run
 *   pnpm run backfill:gym-image-variants -- --limit 5
 *   pnpm run backfill:gym-image-variants
 *   pnpm run backfill:gym-image-variants -- --force-reencode
 *   pnpm run backfill:gym-image-variants -- --ids 0e22694a-...,e29ebc42-...
 *
 * Options:
 *   --dry-run         Log actions only; no uploads or DB writes
 *   --limit N         Process at most N rows (default: all pending)
 *   --batch-size N    Rows per batch (default: 25)
 *   --delay-ms N      Pause between batches (default: 750)
 *   --force-reencode  Re-encode every row (refresh stale w400/w800/w1200 at quality 78)
 *   --ids ID[,ID...]  Only process these gym_images.id values (implies --force-reencode)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'
import { rgbaToThumbHash } from 'thumbhash'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

/** Must stay in sync with lib/images/gym-image-variants.ts */
const GYM_IMAGE_VARIANT_WIDTHS = [400, 800, 1200]
const BUCKET = 'gym-images'
const WEBP_QUALITY = 78

function loadEnvLocal() {
  const envPath = path.join(ROOT, '.env.local')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}

function parseArgs(argv) {
  const opts = {
    dryRun: false,
    limit: Infinity,
    batchSize: 25,
    delayMs: 750,
    forceReencode: false,
    ids: null,
  }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--dry-run') opts.dryRun = true
    else if (arg === '--force-reencode') opts.forceReencode = true
    else if (arg === '--limit') opts.limit = Number(argv[++i])
    else if (arg.startsWith('--limit=')) opts.limit = Number(arg.split('=')[1])
    else if (arg === '--batch-size') opts.batchSize = Number(argv[++i])
    else if (arg.startsWith('--batch-size=')) opts.batchSize = Number(arg.split('=')[1])
    else if (arg === '--delay-ms') opts.delayMs = Number(argv[++i])
    else if (arg.startsWith('--delay-ms=')) opts.delayMs = Number(arg.split('=')[1])
    else if (arg === '--ids') opts.ids = argv[++i]
    else if (arg.startsWith('--ids=')) opts.ids = arg.split('=').slice(1).join('=')
  }
  if (opts.ids) {
    opts.forceReencode = true
    opts.ids = opts.ids.split(',').map((id) => id.trim()).filter(Boolean)
  }
  return opts
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseStoragePath(publicUrl) {
  const marker = `/storage/v1/object/public/${BUCKET}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return null
  return decodeURIComponent(publicUrl.slice(idx + marker.length).split('?')[0])
}

function stemFromStoragePath(storagePath) {
  const base = path.posix.basename(storagePath)
  const ext = path.posix.extname(base)
  return ext ? base.slice(0, -ext.length) : base
}

function variantStoragePath(gymId, stem, widthKey) {
  return `${gymId}/variants/${stem}-${widthKey}.webp`
}

function needsBackfill(variants) {
  if (!variants || typeof variants !== 'object') return true
  const hasWidth = variants.w400 || variants.w800 || variants.w1200
  const hasThumbhash = typeof variants.thumbhash === 'string' && variants.thumbhash.length > 0
  return !hasWidth || !hasThumbhash
}

function mergeVariants(existing, generated) {
  return { ...(existing || {}), ...generated }
}

async function downloadOriginal(url) {
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) throw new Error(`Download failed (${res.status}): ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length === 0) throw new Error(`Empty download: ${url}`)
  return buf
}

async function generateThumbhash(originalBuffer) {
  const { data, info } = await sharp(originalBuffer, { failOn: 'none' })
    .rotate()
    .ensureAlpha()
    .resize(100, 100, { fit: 'inside', withoutEnlargement: true })
    .raw()
    .toBuffer({ resolveWithObject: true })
  const rgba = new Uint8Array(data)
  const hash = rgbaToThumbHash(info.width, info.height, rgba)
  return Buffer.from(hash).toString('base64')
}

async function sanitizeOriginalBuffer(originalBuffer, gymId, stem, storagePath) {
  const meta = await sharp(originalBuffer, { failOn: 'none' }).rotate().metadata()
  const format = meta.format
  if (format === 'png') {
    return {
      buffer: await sharp(originalBuffer, { failOn: 'none' }).rotate().png({ compressionLevel: 9 }).toBuffer(),
      contentType: 'image/png',
      storagePath,
    }
  }
  if (format === 'webp') {
    return {
      buffer: await sharp(originalBuffer, { failOn: 'none' }).rotate().webp({ quality: 92 }).toBuffer(),
      contentType: 'image/webp',
      storagePath,
    }
  }
  if (format === 'jpeg' || format === 'jpg') {
    return {
      buffer: await sharp(originalBuffer, { failOn: 'none' }).rotate().jpeg({ quality: 92, mozjpeg: true }).toBuffer(),
      contentType: 'image/jpeg',
      storagePath,
    }
  }
  if (format === 'heif' || format === 'heic') {
    return {
      buffer: await sharp(originalBuffer, { failOn: 'none' }).rotate().webp({ quality: 90 }).toBuffer(),
      contentType: 'image/webp',
      storagePath: `${gymId}/${stem}.webp`,
    }
  }
  return {
    buffer: await sharp(originalBuffer, { failOn: 'none' }).rotate().jpeg({ quality: 92, mozjpeg: true }).toBuffer(),
    contentType: 'image/jpeg',
    storagePath,
  }
}

async function generateVariantBuffers(originalBuffer) {
  const pipeline = sharp(originalBuffer, { failOn: 'none' }).rotate()
  const meta = await pipeline.metadata()
  const sourceWidth = meta.width || 0
  if (sourceWidth <= 0) throw new Error('Could not read image width')

  const out = {}
  const applicableWidths = GYM_IMAGE_VARIANT_WIDTHS.filter((width) => width <= sourceWidth)

  if (applicableWidths.length === 0) {
    out.w400 = await sharp(originalBuffer, { failOn: 'none' })
      .rotate()
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toBuffer()
    return out
  }

  for (const width of applicableWidths) {
    const key = `w${width}`
    const buffer = await sharp(originalBuffer, { failOn: 'none' })
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toBuffer()
    out[key] = buffer
  }
  return out
}

async function fetchPendingRows(supabase, limit, { forceReencode = false, ids = null } = {}) {
  if (ids?.length) {
    const { data, error } = await supabase
      .from('gym_images')
      .select('id, gym_id, url, variants')
      .in('id', ids)
      .order('id', { ascending: true })
    if (error) throw error
    return data || []
  }

  const pageSize = 200
  const rows = []
  let from = 0

  while (rows.length < limit) {
    const { data, error } = await supabase
      .from('gym_images')
      .select('id, gym_id, url, variants')
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1)

    if (error) throw error
    if (!data?.length) break

    for (const row of data) {
      if (forceReencode || needsBackfill(row.variants)) {
        rows.push(row)
        if (rows.length >= limit) break
      }
    }

    if (data.length < pageSize) break
    from += pageSize
  }

  return rows
}

async function processRow(supabase, row, dryRun) {
  const storagePath = parseStoragePath(row.url)
  if (!storagePath) {
    return { id: row.id, status: 'skipped', reason: 'unparseable url' }
  }

  const stem = stemFromStoragePath(storagePath)
  if (!stem) {
    return { id: row.id, status: 'skipped', reason: 'empty stem' }
  }

  const originalBuffer = await downloadOriginal(row.url)
  const [thumbhash, variantBuffers, sanitized] = await Promise.all([
    generateThumbhash(originalBuffer),
    generateVariantBuffers(originalBuffer),
    sanitizeOriginalBuffer(originalBuffer, row.gym_id, stem, storagePath),
  ])
  const keys = Object.keys(variantBuffers)
  if (keys.length === 0) {
    return { id: row.id, status: 'skipped', reason: 'no applicable widths' }
  }

  const bucket = supabase.storage.from(BUCKET)
  const generatedVariants = { thumbhash }

  if (!dryRun) {
    const { error: sanitizeError } = await bucket.upload(sanitized.storagePath, sanitized.buffer, {
      cacheControl: '31536000',
      contentType: sanitized.contentType,
      upsert: true,
    })
    if (sanitizeError) {
      throw new Error(`Sanitized original upload failed: ${sanitizeError.message}`)
    }
    if (sanitized.storagePath !== storagePath) {
      await bucket.remove([storagePath])
    }
  }

  const nextUrl =
    dryRun
      ? row.url
      : bucket.getPublicUrl(sanitized.storagePath).data.publicUrl

  for (const key of keys) {
    const variantPath = variantStoragePath(row.gym_id, stem, key)
    if (dryRun) {
      generatedVariants[key] = `(dry-run) ${variantPath}`
      continue
    }

    const { error: uploadError } = await bucket.upload(variantPath, variantBuffers[key], {
      cacheControl: '31536000',
      contentType: 'image/webp',
      upsert: true,
    })
    if (uploadError) {
      throw new Error(`Upload failed for ${variantPath}: ${uploadError.message}`)
    }
    generatedVariants[key] = bucket.getPublicUrl(variantPath).data.publicUrl
  }

  const nextVariants = mergeVariants(row.variants, generatedVariants)

  if (!dryRun) {
    const { error: updateError } = await supabase
      .from('gym_images')
      .update({ url: nextUrl, variants: nextVariants })
      .eq('id', row.id)
    if (updateError) {
      throw new Error(`DB update failed for ${row.id}: ${updateError.message}`)
    }
  }

  return {
    id: row.id,
    status: dryRun ? 'dry-run' : 'ok',
    keys: [...keys, 'thumbhash'],
    stem,
    w400Bytes: variantBuffers.w400?.length,
  }
}

async function main() {
  loadEnvLocal()
  const opts = parseArgs(process.argv.slice(2))

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local',
    )
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const pending = await fetchPendingRows(supabase, opts.limit, {
    forceReencode: opts.forceReencode,
    ids: opts.ids,
  })

  const modeLabel = opts.ids
    ? `targeted (${opts.ids.length} id(s))`
    : opts.forceReencode
      ? 'force-reencode (all rows)'
      : 'without variants'

  console.log(
    `Found ${pending.length} gym_images row(s) — ${modeLabel}` +
      (opts.dryRun ? ' (dry-run)' : ''),
  )

  if (pending.length === 0) return

  let ok = 0
  let skipped = 0
  let failed = 0

  for (let i = 0; i < pending.length; i += opts.batchSize) {
    const batch = pending.slice(i, i + opts.batchSize)
    console.log(
      `\nBatch ${Math.floor(i / opts.batchSize) + 1}: rows ${i + 1}-${i + batch.length} of ${pending.length}`,
    )

    for (const row of batch) {
      try {
        const result = await processRow(supabase, row, opts.dryRun)
        if (result.status === 'skipped') {
          skipped++
          console.warn(`  skip ${row.id}: ${result.reason}`)
        } else {
          ok++
          const sizeNote =
            result.w400Bytes != null ? ` w400=${Math.round(result.w400Bytes / 1024)}KB` : ''
          console.log(
            `  ${result.status} ${row.id} gym=${row.gym_id} stem=${result.stem} keys=${result.keys.join(',')}${sizeNote}`,
          )
        }
      } catch (err) {
        failed++
        console.error(
          `  fail ${row.id} gym=${row.gym_id} url=${row.url}:`,
          err instanceof Error ? err.message : err,
        )
      }
    }

    if (i + opts.batchSize < pending.length && opts.delayMs > 0) {
      await sleep(opts.delayMs)
    }
  }

  console.log(`\nDone. ok=${ok} skipped=${skipped} failed=${failed}`)
  if (failed > 0) process.exitCode = 1
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
