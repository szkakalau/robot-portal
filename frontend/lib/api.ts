const IS_PROD = process.env.NODE_ENV === 'production'
const DEFAULT_API_BASE = IS_PROD
  ? 'https://robot-portal-api.onrender.com'
  : 'http://localhost:8000'
const apiBaseEnv = process.env.NEXT_PUBLIC_API_BASE || ''
const API_BASE =
  IS_PROD && apiBaseEnv.includes('localhost')
    ? DEFAULT_API_BASE
    : (apiBaseEnv || DEFAULT_API_BASE)
const DATA_MODE = process.env.NEXT_PUBLIC_DATA_MODE || ''
const USE_API_FIRST =
  DATA_MODE === 'api' ||
  (DATA_MODE !== 'static' && API_BASE && !API_BASE.includes('localhost')) ||
  (IS_PROD && API_BASE && !API_BASE.includes('localhost'))

async function getSiteUrl() {
  const site = process.env.NEXT_PUBLIC_SITE_URL
  if (site && site.startsWith('http')) return site
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (production) return `https://${production}`
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

async function fetchJSON(path: string, base: string = API_BASE) {
  const r = await fetch(`${base}${path}`, { cache: 'no-store' })
  if (!r.ok) throw new Error('API error')
  return r.json()
}

type ArticleFetchOptions = {
  preferApi?: boolean
  ignoreStatic?: boolean
  apiBaseOverride?: string
}

export async function getArticles(options: ArticleFetchOptions = {}) {
  const { preferApi = false, ignoreStatic = false, apiBaseOverride } = options
  const apiBase = apiBaseOverride || API_BASE
  const staticData = ignoreStatic ? [] : await readStaticJSON('articles.json')
  if (!ignoreStatic && DATA_MODE === 'static') return staticData
  if (preferApi || USE_API_FIRST) {
    try {
      const data = await fetchJSON('/articles', apiBase)
      if (Array.isArray(data) && data.length > 0) return data
    } catch {}
  }
  if (!ignoreStatic && Array.isArray(staticData) && staticData.length > 0) return staticData
  try {
    const data = await fetchJSON('/articles', apiBase)
    if (Array.isArray(data) && data.length > 0) return data
  } catch {}
  return staticData
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
  const staticRobots = await readStaticJSON('robots.json')
  if (DATA_MODE === 'static') return applyFilters(staticRobots || [])
  if (USE_API_FIRST) {
    const qs = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && `${v}`.trim() !== '') qs.set(k, `${v}`)
    })
    const query = qs.toString()
    try {
      const data = await fetchJSON(query ? `/robots?${query}` : '/robots')
      if (Array.isArray(data) && data.length > 0) return data
    } catch {}
  }
  if (Array.isArray(staticRobots) && staticRobots.length > 0) return applyFilters(staticRobots)
  const qs = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && `${v}`.trim() !== '') qs.set(k, `${v}`)
  })
  const query = qs.toString()
  try {
    const data = await fetchJSON(query ? `/robots?${query}` : '/robots')
    if (Array.isArray(data) && data.length > 0) return data
  } catch {}
  return applyFilters(staticRobots || [])
}

export async function getNews() {
  const staticData = await readStaticJSON('news.json')
  if (DATA_MODE === 'static') return staticData
  if (USE_API_FIRST) {
    try {
      const data = await fetchJSON('/news')
      if (Array.isArray(data) && data.length > 0) return data
    } catch {}
  }
  if (Array.isArray(staticData) && staticData.length > 0) return staticData
  try {
    const data = await fetchJSON('/news')
    if (Array.isArray(data) && data.length > 0) return data
  } catch {}
  return staticData
}

export async function getArticle(slug: string) {
  const fromStatic = async (articles?: any[]) => {
    const source = articles || (await readStaticJSON('articles.json'))
    const match = (source || []).find((a: any) => a.slug === slug)
    if (!match) throw new Error('Article not found')
    return match
  }
  const staticArticles = await readStaticJSON('articles.json')
  if (DATA_MODE === 'static') return fromStatic(staticArticles)
  if (USE_API_FIRST) {
    try {
      return await fetchJSON(`/article/${slug}`)
    } catch {}
  }
  const staticMatch = (staticArticles || []).find((a: any) => a.slug === slug)
  if (staticMatch) return staticMatch
  try {
    return await fetchJSON(`/article/${slug}`)
  } catch {
    return fromStatic(staticArticles)
  }
}

export async function getRobotByName(name: string) {
  const fromStatic = async (robots?: any[]) => {
    const source = robots || (await readStaticJSON('robots.json'))
    const match = (source || []).find((r: any) => r.name === name)
    if (!match) throw new Error('Robot not found')
    return match
  }
  const staticRobots = await readStaticJSON('robots.json')
  const staticMatch = (staticRobots || []).find((r: any) => r.name === name)
  if (staticMatch) return staticMatch
  if (DATA_MODE === 'static') return fromStatic(staticRobots)
  try {
    return await fetchJSON(`/robot/by-name/${encodeURIComponent(name)}`)
  } catch {
    return fromStatic(staticRobots)
  }
}
