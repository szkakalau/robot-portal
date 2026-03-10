const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

async function fetchJSON(path: string) {
  const r = await fetch(`${API_BASE}${path}`, {cache: 'no-store'})
  if (!r.ok) throw new Error('API error')
  return r.json()
}

export async function getArticles() {
  return fetchJSON('/articles')
}

export async function getRobots() {
  return fetchJSON('/robots')
}

export async function getNews() {
  return fetchJSON('/news')
}

export async function getArticle(slug: string) {
  return fetchJSON(`/article/${slug}`)
}
