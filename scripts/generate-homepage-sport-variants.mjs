/**
 * Homepage “Browse by sport” carousel — fixed-width WebP variants (no Vercel Image Optimization).
 *
 * When to run: after you replace any source file listed in SOURCES below, or add/change a slug
 * (also update `lib/homepage/homepage-sport-tile-images.ts` so URLs stay in sync).
 *
 *   pnpm run generate:homepage-sports
 *
 * Outputs are written under `public/homepage-sports/` and should be committed so production
 * builds avoid extra work. If the sport catalogue grows large, consider build-time generation
 * or storage-backed variants instead of many committed binaries.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const OUT_DIR = path.join(PUBLIC, 'homepage-sports')

/** Slug basename must match keys in lib/homepage/homepage-sport-tile-images.ts */
const SOURCES = [
  { slug: 'muay-thai', file: 'N-8427.jpeg.avif' },
  { slug: 'boxing', file: 'e079bedfbf7e870f827b4fda7ce2132f.avif' },
  { slug: 'mma', file: '1296749132.jpg' },
  { slug: 'bjj', file: 'IMG_3557_246c0a62-a253-4f95-abfd-9cb306228c6c.jpg' },
  { slug: 'wrestling', file: 'tjj8r5ovjts8nhqjhkqc.avif' },
  { slug: 'kickboxing', file: 'Superbon-Singha-Mawynn-Chingiz-Allazov-ONE-Fight-Night-6-1920X1280-62.jpg' },
]

const WIDTHS = [400, 800]

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  for (const { slug, file } of SOURCES) {
    const inputPath = path.join(PUBLIC, file)
    if (!fs.existsSync(inputPath)) {
      console.error(`Missing source: ${inputPath}`)
      process.exitCode = 1
      continue
    }
    for (const w of WIDTHS) {
      const dest = path.join(OUT_DIR, `${slug}-${w}.webp`)
      await sharp(inputPath)
        .rotate()
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toFile(dest)
      console.log('Wrote', path.relative(ROOT, dest))
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
