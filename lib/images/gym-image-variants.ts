import type { GymImage, GymImageVariants } from '@/lib/types/database'

export const GYM_IMAGE_VARIANT_WIDTHS = [400, 800, 1200] as const

export type GeneratedGymImageVariant = {
  key: keyof GymImageVariants
  width: (typeof GYM_IMAGE_VARIANT_WIDTHS)[number]
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
    const bitmap = await createImageBitmap(file)
    return {
      image: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      cleanup: () => bitmap.close(),
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

export async function createGymImageVariantBlobs(file: File): Promise<GeneratedGymImageVariant[]> {
  if (!file.type.startsWith('image/')) return []

  const loaded = await loadImage(file)
  try {
    return await Promise.all(
      GYM_IMAGE_VARIANT_WIDTHS.filter((width) => width <= loaded.width).map(async (width) => {
        const height = Math.max(1, Math.round((loaded.height / loaded.width) * width))
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Could not prepare image variant canvas')
        ctx.drawImage(loaded.image, 0, 0, width, height)
        const blob = await canvasToWebp(canvas, 0.78)
        return { key: `w${width}` as keyof GymImageVariants, width, blob }
      })
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
}: {
  supabase: SupabaseStorageClient
  gymId: string
  file: File
  stem: string
}): Promise<UploadedGymImageWithVariants> {
  const bucket = supabase.storage.from('gym-images')
  const fileExt = file.name.split('.').pop() || 'jpg'
  const originalPath = `${gymId}/${stem}.${fileExt}`

  const { error: uploadError } = await bucket.upload(originalPath, file, {
    cacheControl: '31536000',
    upsert: false,
  })
  if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`)

  const { data: urlData } = bucket.getPublicUrl(originalPath)
  if (!urlData?.publicUrl) throw new Error('Failed to get public URL for uploaded image')

  const variants: GymImageVariants = {}
  const storagePaths = [originalPath]

  try {
    const generated = await createGymImageVariantBlobs(file)
    for (const variant of generated) {
      const variantPath = `${gymId}/variants/${stem}-${variant.key}.webp`
      const { error: variantUploadError } = await bucket.upload(variantPath, variant.blob, {
        cacheControl: '31536000',
        contentType: 'image/webp',
        upsert: false,
      })
      if (variantUploadError) throw new Error(variantUploadError.message)
      variants[variant.key] = bucket.getPublicUrl(variantPath).data.publicUrl
      storagePaths.push(variantPath)
    }
  } catch (error) {
    // Variant generation is an optimization; keep the original image as a safe fallback.
    console.warn('Image variant generation failed:', error)
  }

  return { url: urlData.publicUrl, variants, storagePaths }
}

export function gymImageSrc(image: Pick<GymImage, 'url' | 'variants'> | null | undefined): string {
  return image?.variants?.w800 || image?.variants?.w1200 || image?.variants?.w400 || image?.url || ''
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
