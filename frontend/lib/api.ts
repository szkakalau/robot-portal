const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'
const DATA_MODE = process.env.NEXT_PUBLIC_DATA_MODE || ''

async function readStaticJSON(filename: string) {
  const { readFile } = await import('fs/promises')
  const { join } = await import('path')
  const filePath = join(process.cwd(), 'public', 'data', filename)
  const raw = await readFile(filePath, 'utf-8')
  return JSON.parse(raw)
}

async function fetchJSON(path: string) {
  const r = await fetch(`${API_BASE}${path}`, { cache: 'no-store' })
  if (!r.ok) throw new Error('API error')
  return r.json()
}

export async function getArticles() {
  if (DATA_MODE === 'static') return readStaticJSON('articles.json')
  return fetchJSON('/articles')
}

type RobotFilters = {
  category?: string
  company?: string
  q?: string
  min_price?: string | number
  max_price?: string | number
  limit?: string | number
}

export async function getRobots(filters: RobotFilters = {}) {
  if (DATA_MODE === 'static') {
    const robots = await readStaticJSON('robots.json')
    const q = `${filters.q || ''}`.toLowerCase().trim()
    const category = `${filters.category || ''}`.toLowerCase().trim()
    const company = `${filters.company || ''}`.toLowerCase().trim()
    const minPrice = filters.min_price !== undefined ? Number(filters.min_price) : undefined
    const maxPrice = filters.max_price !== undefined ? Number(filters.max_price) : undefined
    const filtered = (robots || []).filter((r: any) => {
      if (category && `${r.category || ''}`.toLowerCase() !== category) return false
      if (company && `${r.company || ''}`.toLowerCase() !== company) return false
      if (q && !(`${r.name || ''}`.toLowerCase().includes(q) || `${r.description || ''}`.toLowerCase().includes(q))) return false
      if (minPrice !== undefined && !(Number(r.price) >= minPrice)) return false
      if (maxPrice !== undefined && !(Number(r.price) <= maxPrice)) return false
      return true
    })
    const limit = filters.limit ? Math.max(1, Math.min(500, Number(filters.limit))) : 200
    return filtered.slice(0, limit)
  }
  const qs = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && `${v}`.trim() !== '') qs.set(k, `${v}`)
  })
  const query = qs.toString()
  return fetchJSON(query ? `/robots?${query}` : '/robots')
}

export async function getNews() {
  if (DATA_MODE === 'static') return readStaticJSON('news.json')
  return fetchJSON('/news')
}

export async function getArticle(slug: string) {
  if (DATA_MODE === 'static') {
    const articles = await readStaticJSON('articles.json')
    const match = (articles || []).find((a: any) => a.slug === slug)
    if (!match) throw new Error('Article not found')
    return match
  }
  return fetchJSON(`/article/${slug}`)
}

export async function getRobotByName(name: string) {
  if (DATA_MODE === 'static') {
    const robots = await readStaticJSON('robots.json')
    const match = (robots || []).find((r: any) => r.name === name)
    if (!match) throw new Error('Robot not found')
    return match
  }
  return fetchJSON(`/robot/by-name/${encodeURIComponent(name)}`)
}
