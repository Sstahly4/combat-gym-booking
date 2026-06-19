import type { GymImage, GymImageVariants } from '@/lib/types/database'

export const GYM_IMAGE_VARIANT_WIDTHS = [400, 800, 1200] as const

/** Max longest edge before upload — keeps variant generation fast on phone photos. */
export const GYM_UPLOAD_MAX_EDGE = 2000

const GYM_UPLOAD_PREPARE_WEBP_QUALITY = 0.78
const GYM_UPLOAD_SKIP_PREPARE_MAX_BYTES = 500_000

/** Storage prefix under the gym-images bucket (e.g. `{gymId}/packages`). */
export function gymImageAssetBase(gymId: string, subdir?: string): string {
  if (!subdir) return gymId
  const clean = subdir.replace(/^\/+|\/+$/g, '')
  return clean ? `${gymId}/${clean}` : gymId
}

export function variantStoragePath(assetBase: string, stem: string, widthKey: 'w400' | 'w800' | 'w1200') {
  return `${assetBase}/variants/${stem}-${widthKey}.webp`
}

export type GeneratedGymImageVariant = {
  key: 'w400' | 'w800' | 'w1200'
  width: number
  blob: Blob
}

type SupabaseStorageClient = {
  storage: {
    from: (bucket: string) => {
      upload: (
        path: string,
        body: File | Blob,
        options?: { cacheControl?: string; upsert?: boolean; contentType?: string }
      ) => Promise<{ error: { message: string } | null }>
      getPublicUrl: (path: string) => { data: { publicUrl: string } }
      remove: (paths: string[]) => Promise<{ error: { message: string } | null }>
    }
  }
}

export type UploadedGymImageWithVariants = {
  url: string
  variants: GymImageVariants
  storagePaths: string[]
}

type LoadedImage = {
  image: CanvasImageSource
  width: number
  height: number
  cleanup: () => void
}

async function loadImage(file: File): Promise<LoadedImage> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return {
        image: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      }
    } catch {
      const bitmap = await createImageBitmap(file)
      return {
        image: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      }
    }
  }

  const url = URL.createObjectURL(file)
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not decode image'))
    img.src = url
  })

  return {
    image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    cleanup: () => URL.revokeObjectURL(url),
  }
}

function canvasToWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Could not encode image variant'))
        else resolve(blob)
      },
      'image/webp',
      quality
    )
  })
}

function variantTargetsForWidth(sourceWidth: number): Array<{
  key: 'w400' | 'w800' | 'w1200'
  width: number
}> {
  const targets: Array<{ key: 'w400' | 'w800' | 'w1200'; width: number }> =
    GYM_IMAGE_VARIANT_WIDTHS.filter((width) => width <= sourceWidth).map((width) => ({
      key: `w${width}` as 'w400' | 'w800' | 'w1200',
      width,
    }))
  // Sources narrower than 400px still get a w400 WebP at native resolution.
  if (targets.length === 0 && sourceWidth > 0) {
    targets.push({ key: 'w400', width: sourceWidth })
  }
  return targets
}

/** Downscale large phone photos in-browser before variant generation and upload. */
export async function prepareGymImageUploadFile(file: File): Promise<File> {
  if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|gif|avif|heic|heif)$/i.test(file.name)) {
    return file
  }

  const loaded = await loadImage(file)
  try {
    const maxEdge = Math.max(loaded.width, loaded.height)
    const needsResize = maxEdge > GYM_UPLOAD_MAX_EDGE
    const needsCompress = file.size > GYM_UPLOAD_SKIP_PREPARE_MAX_BYTES
    if (!needsResize && !needsCompress) return file

    const scale = needsResize ? GYM_UPLOAD_MAX_EDGE / maxEdge : 1
    const targetWidth = Math.max(1, Math.round(loaded.width * scale))
    const targetHeight = Math.max(1, Math.round(loaded.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not prepare image canvas')
    ctx.drawImage(loaded.image, 0, 0, targetWidth, targetHeight)

    const blob = await canvasToWebp(canvas, GYM_UPLOAD_PREPARE_WEBP_QUALITY)
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo'
    return new File([blob], `${baseName}.webp`, { type: 'image/webp', lastModified: Date.now() })
  } finally {
    loaded.cleanup()
  }
}

export function canonicalGymImageUrl(variants: GymImageVariants): string {
  return variants.w1200 || variants.w800 || variants.w400 || ''
}

export async function createGymImageVariantBlobs(file: File): Promise<GeneratedGymImageVariant[]> {
  if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|gif|avif|heic|heif)$/i.test(file.name)) {
    return []
  }

  const loaded = await loadImage(file)
  try {
    return await Promise.all(
      variantTargetsForWidth(loaded.width).map(async ({ key, width }) => {
        const height = Math.max(1, Math.round((loaded.height / loaded.width) * width))
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Could not prepare image variant canvas')
        ctx.drawImage(loaded.image, 0, 0, width, height)
        const blob = await canvasToWebp(canvas, 0.78)
        return { key, width, blob }
      }),
    )
  } finally {
    loaded.cleanup()
  }
}

export async function uploadGymImageWithVariants({
  supabase,
  gymId,
  file,
  stem,
  subdir,
}: {
  supabase: SupabaseStorageClient
  gymId: string
  file: File
  stem: string
  /** e.g. `packages`, `accommodations`, `package-variants/{packageId}` */
  subdir?: string
}): Promise<UploadedGymImageWithVariants> {
  const bucket = supabase.storage.from('gym-images')
  const assetBase = gymImageAssetBase(gymId, subdir)
  const prepared = await prepareGymImageUploadFile(file)

  const variants: GymImageVariants = {}
  const storagePaths: string[] = []
  const uploadedVariantPaths: string[] = []

  try {
    const generated = await createGymImageVariantBlobs(prepared)
    if (generated.length === 0) {
      throw new Error(
        'Could not generate WebP variants from this file. Use JPEG, PNG, or WebP — HEIC/HEIF is not supported in the browser uploader.',
      )
    }
    for (const variant of generated) {
      const variantPath = variantStoragePath(assetBase, stem, variant.key)
      const { error: variantUploadError } = await bucket.upload(variantPath, variant.blob, {
        cacheControl: '31536000',
        contentType: 'image/webp',
        upsert: false,
      })
      if (variantUploadError) throw new Error(variantUploadError.message)
      variants[variant.key] = bucket.getPublicUrl(variantPath).data.publicUrl
      storagePaths.push(variantPath)
      uploadedVariantPaths.push(variantPath)
    }
  } catch (error) {
    await bucket.remove(uploadedVariantPaths).catch(() => {})
    throw error instanceof Error ? error : new Error('Image variant generation failed')
  }

  if (!variants.w400) {
    await bucket.remove(uploadedVariantPaths).catch(() => {})
    throw new Error('Upload requires a w400 WebP variant. Try a standard photo format or a larger image.')
  }

  const url = canonicalGymImageUrl(variants)
  if (!url) {
    await bucket.remove(uploadedVariantPaths).catch(() => {})
    throw new Error('Upload requires at least one WebP variant.')
  }

  return { url, variants, storagePaths }
}

export function gymImageSrc(image: Pick<GymImage, 'url' | 'variants'> | null | undefined): string {
  return image?.variants?.w800 || image?.variants?.w1200 || image?.variants?.w400 || image?.url || ''
}

/** Card/thumbnail contexts — prefer smallest variant to minimize CDN egress. */
export function gymImageCardSrc(image: Pick<GymImage, 'url' | 'variants'> | null | undefined): string {
  return image?.variants?.w400 || image?.variants?.w800 || image?.variants?.w1200 || image?.url || ''
}

export function gymImageSrcSet(image: Pick<GymImage, 'url' | 'variants'> | null | undefined): string | undefined {
  const v = image?.variants
  if (!v) return undefined
  const parts = [
    v.w400 ? `${v.w400} 400w` : null,
    v.w800 ? `${v.w800} 800w` : null,
    v.w1200 ? `${v.w1200} 1200w` : null,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : undefined
}

type GymImagePick = Pick<GymImage, 'url' | 'variants'> & { order?: number | null }

function primaryGymImage(
  images: GymImagePick[] | null | undefined,
): GymImagePick | null {
  if (!images?.length) return null
  return [...images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0] ?? null
}

/** Sorted primary image URL for card/thumbnail contexts (checkout, review, etc.). */
export function primaryGymImageCardSrc(images: GymImagePick[] | null | undefined): string | null {
  const img = primaryGymImage(images)
  if (!img) return null
  const src = gymImageCardSrc(img)
  return src || null
}

/** Sorted primary image URL for larger hero/thumbnail contexts. */
export function primaryGymImageHeroSrc(images: GymImagePick[] | null | undefined): string | null {
  const img = primaryGymImage(images)
  if (!img) return null
  const src = gymImageSrc(img)
  return src || null
}

export function gymImageThumbhash(
  image: Pick<GymImage, 'variants'> | null | undefined,
): string | null {
  const hash = image?.variants?.thumbhash
  return typeof hash === 'string' && hash.length > 0 ? hash : null
}

/** Serialize upload result for text[] / text columns (backward-compatible plain URL). */
export function serializeManagedImageRef(upload: UploadedGymImageWithVariants): string {
  const v = upload.variants
  if (v?.w400 || v?.w800 || v?.w1200 || v?.thumbhash) {
    return JSON.stringify({ url: upload.url, variants: v })
  }
  return upload.url
}

/** Parse a stored image ref (plain URL or JSON with variants). */
export function parseManagedImageRef(ref: string): Pick<GymImage, 'url' | 'variants'> {
  if (ref.startsWith('{')) {
    try {
      const parsed = JSON.parse(ref) as { url?: string; variants?: GymImageVariants }
      if (parsed?.url) return { url: parsed.url, variants: parsed.variants ?? null }
    } catch {
      /* fall through */
    }
  }
  return { url: ref, variants: null }
}

/** Plain URL for `<img src>` from a stored package/accommodation ref (URL or JSON + variants). */
export function managedImageDisplayUrl(ref: string | null | undefined): string | null {
  if (!ref) return null
  const parsed = parseManagedImageRef(ref)
  return gymImageCardSrc(parsed) || parsed.url || null
}

/** Map a stored image URL to gallery metadata (variants) when it matches a gym_images row. */
export function resolveUrlToGymImage(
  gym: { images?: GymImage[] | null },
  url: string | null | undefined
): Pick<GymImage, 'url' | 'variants'> | null {
  if (!url) return null
  if (url.startsWith('{')) return parseManagedImageRef(url)
  for (const img of gym.images ?? []) {
    if (img.url === url) return img
    const v = img.variants
    if (v?.w400 === url || v?.w800 === url || v?.w1200 === url) return img
  }
  return { url, variants: null }
}
