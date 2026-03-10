const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

async function fetchJSON(path: string) {
  const r = await fetch(`${API_BASE}${path}`, {cache: 'no-store'})
  if (!r.ok) throw new Error('API error')
  return r.json()
}

export async function getArticles() {
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
  const qs = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && `${v}`.trim() !== '') qs.set(k, `${v}`)
  })
  const query = qs.toString()
  return fetchJSON(query ? `/robots?${query}` : '/robots')
}

export async function getNews() {
  return fetchJSON('/news')
}

export async function getArticle(slug: string) {
  return fetchJSON(`/article/${slug}`)
}

export async function getRobotByName(name: string) {
  return fetchJSON(`/robot/by-name/${encodeURIComponent(name)}`)
}
