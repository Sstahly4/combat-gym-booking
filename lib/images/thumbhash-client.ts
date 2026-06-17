'use client'

import { thumbHashToRGBA } from 'thumbhash'

/** Decode a base64 ThumbHash (from gym_images.variants.thumbhash) to a data URL. */
export function thumbhashBase64ToDataUrl(base64: string): string | null {
  if (!base64) return null
  try {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const { w, h, rgba } = thumbHashToRGBA(bytes)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const imageData = ctx.createImageData(w, h)
    imageData.data.set(rgba)
    ctx.putImageData(imageData, 0, 0)
    return canvas.toDataURL()
  } catch {
    return null
  }
}
