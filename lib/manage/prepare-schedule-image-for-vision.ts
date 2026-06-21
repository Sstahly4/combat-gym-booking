import 'server-only'

import sharp from 'sharp'

const VISION_MAX_EDGE = 1600
const MAX_BYTES = 10 * 1024 * 1024

/** Downscale phone photos before vision API — faster, fits serverless limits. */
export async function prepareScheduleImageForVision(
  buffer: Buffer,
): Promise<{ base64: string; mimeType: string }> {
  if (buffer.length === 0) {
    throw new Error('Image file is empty.')
  }

  if (buffer.length > MAX_BYTES) {
    throw new Error('Image must be 10 MB or smaller.')
  }

  try {
    const out = await sharp(buffer)
      .rotate()
      .resize({
        width: VISION_MAX_EDGE,
        height: VISION_MAX_EDGE,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer()

    return { base64: out.toString('base64'), mimeType: 'image/jpeg' }
  } catch {
    throw new Error('Could not read this image. Try PNG or JPEG.')
  }
}
