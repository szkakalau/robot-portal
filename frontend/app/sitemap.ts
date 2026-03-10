import type { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

async function fetchJson(url: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  try {
    const res = await fetch(url, { cache: 'no-store', signal: controller.signal })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

async function getRobotData(): Promise<{ names: string[]; categories: string[]; total: number }> {
  const robots = await fetchJson(`${API_BASE}/robots?limit=500`)
  if (!robots) return { names: [], categories: [], total: 0 }
  const names = (robots || []).map((r: any) => r.name).filter((name: any): name is string => Boolean(name))
  const categorySet = new Set<string>(
    (robots || []).map((r: any) => r.category).filter((category: any): category is string => Boolean(category))
  )
  const categories = Array.from(categorySet)
  return { names, categories, total: names.length }
}

async function getArticleData(): Promise<{ slugs: string[]; reviewCount: number }> {
  const articles = await fetchJson(`${API_BASE}/articles`)
  if (!articles) return { slugs: [], reviewCount: 0 }
  const slugs = (articles || [])
    .map((item: any) => item.slug)
    .filter((slug: any): slug is string => Boolean(slug))
  const reviewCount = (articles || []).filter((item: any) => {
    const category = `${item?.category || ''}`.toLowerCase()
    return category === 'review' || category === 'guide'
  }).length
  return { slugs, reviewCount }
}

async function getNewsTotal(): Promise<number> {
  const news = await fetchJson(`${API_BASE}/news`)
  if (!news) return 0
  return Array.isArray(news) ? news.length : 0
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const ROBOT_PAGE_SIZE = 24
  const CONTENT_PAGE_SIZE = 20
  const TOPIC_SLUGS = [
    'robot-dog',
    'ai-robot',
    'robot-toys',
    'best-robot-dog-under-1000',
    'best-robot-toys-for-kids-2026'
  ]
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/news`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/reviews`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/robots`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/search`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 }
  ]
  const topicPages: MetadataRoute.Sitemap = TOPIC_SLUGS.map((slug) => ({
    url: `${SITE_URL}/topic/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6
  }))
  const { names, categories, total } = await getRobotData()
  const robotPages: MetadataRoute.Sitemap = names.map((name) => ({
    url: `${SITE_URL}/robots/${encodeURIComponent(name)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7
  }))
  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/robots?category=${encodeURIComponent(category)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6
  }))
  const robotPageCount = Math.max(1, Math.ceil(total / ROBOT_PAGE_SIZE))
  const pagedRobotLists: MetadataRoute.Sitemap = Array.from({ length: Math.max(0, robotPageCount - 1) }, (_, i) => ({
    url: `${SITE_URL}/robots?page=${i + 2}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.5
  }))
  const { slugs: articleSlugs, reviewCount } = await getArticleData()
  const articlePages: MetadataRoute.Sitemap = articleSlugs.map((slug) => ({
    url: `${SITE_URL}/article/${encodeURIComponent(slug)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6
  }))
  const newsTotal = await getNewsTotal()
  const newsPageCount = Math.max(1, Math.ceil(newsTotal / CONTENT_PAGE_SIZE))
  const reviewPageCount = Math.max(1, Math.ceil(reviewCount / CONTENT_PAGE_SIZE))
  const pagedNews: MetadataRoute.Sitemap = Array.from({ length: Math.max(0, newsPageCount - 1) }, (_, i) => ({
    url: `${SITE_URL}/news?page=${i + 2}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.5
  }))
  const pagedReviews: MetadataRoute.Sitemap = Array.from({ length: Math.max(0, reviewPageCount - 1) }, (_, i) => ({
    url: `${SITE_URL}/reviews?page=${i + 2}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.5
  }))
  return [...staticPages, ...topicPages, ...pagedNews, ...pagedReviews, ...categoryPages, ...pagedRobotLists, ...robotPages, ...articlePages]
}
