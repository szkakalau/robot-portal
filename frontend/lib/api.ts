const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'
const DATA_MODE = process.env.NEXT_PUBLIC_DATA_MODE || ''

async function getSiteUrl() {
  const site = process.env.NEXT_PUBLIC_SITE_URL
  if (site && site.startsWith('http')) return site
  const vercel = process.env.VERCEL_URL
  if (vercel) return `https://${vercel}`
  try {
    const { headers } = await import('next/headers')
    const host = headers().get('host')
    if (host) {
      const protocol = host.includes('localhost') ? 'http' : 'https'
      return `${protocol}://${host}`
    }
  } catch {}
  return 'http://localhost:3000'
}

async function readStaticJSON(filename: string) {
  if (process.env.NEXT_RUNTIME === 'edge') {
    const site = await getSiteUrl()
    const res = await fetch(`${site}/data/${filename}`, { cache: 'no-store' })
    if (!res.ok) return []
    return res.json()
  }
  try {
    const { readFile } = await import('fs/promises')
    const { join } = await import('path')
    const filePath = join(process.cwd(), 'public', 'data', filename)
    const raw = await readFile(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    const site = await getSiteUrl()
    const res = await fetch(`${site}/data/${filename}`, { cache: 'no-store' })
    if (!res.ok) return []
    return res.json()
  }
}

async function fetchJSON(path: string) {
  const r = await fetch(`${API_BASE}${path}`, { cache: 'no-store' })
  if (!r.ok) throw new Error('API error')
  return r.json()
}

export async function getArticles() {
  if (DATA_MODE === 'static') return readStaticJSON('articles.json')
  try {
    const data = await fetchJSON('/articles')
    if (Array.isArray(data) && data.length > 0) return data
  } catch {}
  return readStaticJSON('articles.json')
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
  const applyFilters = (robots: any[]) => {
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
  if (DATA_MODE === 'static') {
    const robots = await readStaticJSON('robots.json')
    return applyFilters(robots || [])
  }
  const qs = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && `${v}`.trim() !== '') qs.set(k, `${v}`)
  })
  const query = qs.toString()
  try {
    const data = await fetchJSON(query ? `/robots?${query}` : '/robots')
    if (Array.isArray(data) && data.length > 0) return data
  } catch {}
  const robots = await readStaticJSON('robots.json')
  return applyFilters(robots || [])
}

export async function getNews() {
  if (DATA_MODE === 'static') return readStaticJSON('news.json')
  try {
    const data = await fetchJSON('/news')
    if (Array.isArray(data) && data.length > 0) return data
  } catch {}
  return readStaticJSON('news.json')
}

export async function getArticle(slug: string) {
  const fromStatic = async () => {
    const articles = await readStaticJSON('articles.json')
    const match = (articles || []).find((a: any) => a.slug === slug)
    if (!match) throw new Error('Article not found')
    return match
  }
  if (DATA_MODE === 'static') return fromStatic()
  try {
    return await fetchJSON(`/article/${slug}`)
  } catch {
    return fromStatic()
  }
}

export async function getRobotByName(name: string) {
  const fromStatic = async () => {
    const robots = await readStaticJSON('robots.json')
    const match = (robots || []).find((r: any) => r.name === name)
    if (!match) throw new Error('Robot not found')
    return match
  }
  if (DATA_MODE === 'static') return fromStatic()
  try {
    return await fetchJSON(`/robot/by-name/${encodeURIComponent(name)}`)
  } catch {
    return fromStatic()
  }
}
