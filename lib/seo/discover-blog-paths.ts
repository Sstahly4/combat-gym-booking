import fs from 'fs'
import path from 'path'

/** Discover static blog routes under app/blog (one segment per folder). */
export function discoverBlogSitemapPaths(): string[] {
  const blogRoot = path.join(process.cwd(), 'app', 'blog')
  const paths = new Set<string>(['/blog'])

  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(blogRoot, { withFileTypes: true })
  } catch {
    return ['/blog']
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (entry.name.startsWith('[')) continue

    const pageFile = path.join(blogRoot, entry.name, 'page.tsx')
    if (fs.existsSync(pageFile)) {
      paths.add('/blog/' + entry.name)
    }
  }

  return Array.from(paths).sort()
}
