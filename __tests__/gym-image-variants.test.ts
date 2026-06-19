import { describe, expect, it } from 'vitest'
import {
  canonicalGymImageUrl,
  gymImageAssetBase,
  gymImageCardSrc,
  gymImageSrc,
  variantStoragePath,
} from '@/lib/images/gym-image-variants'

describe('canonicalGymImageUrl', () => {
  it('prefers the largest available variant', () => {
    expect(
      canonicalGymImageUrl({
        w400: 'https://cdn.example/w400.webp',
        w800: 'https://cdn.example/w800.webp',
        w1200: 'https://cdn.example/w1200.webp',
      }),
    ).toBe('https://cdn.example/w1200.webp')
  })

  it('falls back when only smaller variants exist', () => {
    expect(canonicalGymImageUrl({ w400: 'https://cdn.example/w400.webp' })).toBe(
      'https://cdn.example/w400.webp',
    )
    expect(canonicalGymImageUrl({})).toBe('')
  })
})

describe('gym image display helpers', () => {
  it('uses variants before legacy url', () => {
    const image = {
      url: 'https://cdn.example/original.jpg',
      variants: { w400: 'https://cdn.example/w400.webp', w800: 'https://cdn.example/w800.webp' },
    }
    expect(gymImageCardSrc(image)).toBe('https://cdn.example/w400.webp')
    expect(gymImageSrc(image)).toBe('https://cdn.example/w800.webp')
  })
})

describe('storage paths', () => {
  it('builds gym asset bases and variant paths', () => {
    expect(gymImageAssetBase('gym-1')).toBe('gym-1')
    expect(gymImageAssetBase('gym-1', 'packages')).toBe('gym-1/packages')
    expect(variantStoragePath('gym-1', 'photo-1', 'w800')).toBe(
      'gym-1/variants/photo-1-w800.webp',
    )
  })
})
