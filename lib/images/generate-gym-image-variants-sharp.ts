import sharp from 'sharp'
import { rgbaToThumbHash } from 'thumbhash'
import type { GymImageVariants } from '@/lib/types/database'
import {
  GYM_IMAGE_VARIANT_WIDTHS,
  variantStoragePath,
} from '@/lib/images/gym-image-variants'

export { variantStoragePath }

export const GYM_IMAGE_WEBP_QUALITY = 78
export const GYM_IMAGE_BUCKET = 'gym-images'

const WIDTH_KEYS = new Set(['w400', 'w800', 'w1200'])

export function isGymImageWidthKey(key: string): key is 'w400' | 'w800' | 'w1200' {
  return WIDTH_KEYS.has(key)
}
function strippedSharp(input: Buffer) {
  return sharp(input, { failOn: 'none' }).rotate()
}

/** Build WebP buffers for each applicable width (never upscale). Metadata stripped. */
export async function generateGymImageVariantBuffers(
  originalBuffer: Buffer,
): Promise<Partial<Record<'w400' | 'w800' | 'w1200', Buffer>>> {
  const meta = await strippedSharp(originalBuffer).metadata()
  const sourceWidth = meta.width || 0
  if (sourceWidth <= 0) throw new Error('Could not read image width')

  const out: Partial<Record<'w400' | 'w800' | 'w1200', Buffer>> = {}
  const applicableWidths = GYM_IMAGE_VARIANT_WIDTHS.filter((width) => width <= sourceWidth)

  if (applicableWidths.length === 0) {
    out.w400 = await strippedSharp(originalBuffer)
      .webp({ quality: GYM_IMAGE_WEBP_QUALITY, effort: 4 })
      .toBuffer()
    return out
  }

  for (const width of applicableWidths) {
    const key = `w${width}` as 'w400' | 'w800' | 'w1200'
    out[key] = await strippedSharp(originalBuffer)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: GYM_IMAGE_WEBP_QUALITY, effort: 4 })
      .toBuffer()
  }

  return out
}

/** Compact blur placeholder (~30 bytes base64) for instant LQIP while WebP loads. */
export async function generateGymImageThumbhash(originalBuffer: Buffer): Promise<string> {
  const { data, info } = await strippedSharp(originalBuffer)
    .ensureAlpha()
    .resize(100, 100, { fit: 'inside', withoutEnlargement: true })
    .raw()
    .toBuffer({ resolveWithObject: true })

  const rgba = new Uint8Array(data)
  const hash = rgbaToThumbHash(info.width, info.height, rgba)
  return Buffer.from(hash).toString('base64')
}

export type SanitizedOriginalResult = {
  buffer: Buffer
  contentType: string
  /** When HEIC/HEIF is converted to WebP, storage path + public URL must change. */
  storagePath?: string
  publicUrl?: string
}

/**
 * Re-encode the uploaded original without GPS/EXIF. JPEG/PNG/WebP stay in-place;
 * HEIC/HEIF become WebP at `{gymId}/{stem}.webp`.
 */
export async function sanitizeOriginalGymImage(
  originalBuffer: Buffer,
  _gymId: string,
  _stem: string,
  originalPath: string,
): Promise<SanitizedOriginalResult> {
  const meta = await strippedSharp(originalBuffer).metadata()
  const format = meta.format

  if (format === 'png') {
    return {
      buffer: await strippedSharp(originalBuffer).png({ compressionLevel: 9 }).toBuffer(),
      contentType: 'image/png',
    }
  }

  if (format === 'webp') {
    return {
      buffer: await strippedSharp(originalBuffer).webp({ quality: 92 }).toBuffer(),
      contentType: 'image/webp',
    }
  }

  if (format === 'jpeg' || format === 'jpg') {
    return {
      buffer: await strippedSharp(originalBuffer).jpeg({ quality: 92, mozjpeg: true }).toBuffer(),
      contentType: 'image/jpeg',
    }
  }

  if (format === 'heif' || (format as string) === 'heic') {
    return {
      buffer: await strippedSharp(originalBuffer).webp({ quality: 90 }).toBuffer(),
      contentType: 'image/webp',
      storagePath: originalPath.replace(/\.[^.]+$/, '.webp'),
    }
  }

  // Unknown format — best-effort JPEG without metadata at the original path.
  return {
    buffer: await strippedSharp(originalBuffer).jpeg({ quality: 92, mozjpeg: true }).toBuffer(),
    contentType: 'image/jpeg',
  }
}

export function mergeVariantUrls(
  existing: GymImageVariants | undefined | null,
  generated: Partial<Record<'w400' | 'w800' | 'w1200', string>>,
  thumbhash?: string,
): GymImageVariants {
  return {
    ...(existing || {}),
    ...generated,
    ...(thumbhash ? { thumbhash } : {}),
  }
}
