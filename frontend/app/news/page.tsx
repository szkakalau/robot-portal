import type { Metadata } from 'next'
import { getNews } from '../../lib/api'
import NewsClient from './NewsClient'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

function toPositiveInt(value?: string, fallback: number = 1) {
  const parsed = Number(value || '')
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.floor(parsed)
}

export async function generateMetadata({ searchParams }: { searchParams?: { page?: string; topic?: string } }): Promise<Metadata> {
  const page = toPositiveInt(searchParams?.page, 1)
  const topic = searchParams?.topic ? encodeURIComponent(searchParams.topic) : ''
  const base = topic ? `/news?topic=${topic}` : '/news'
  const canonicalPath = page > 1 ? `${base}${topic ? '&' : '?'}page=${page}` : base
  return {
    title: page > 1 ? `Robot News - Page ${page} | Latest Robotics Updates` : 'Robot News | Latest Robotics Updates',
    description: 'Read daily robot news, robotics funding updates, product launches, and AI robot industry highlights.',
    alternates: {
      canonical: canonicalPath
    },
    openGraph: {
      title: page > 1 ? `Robot News - Page ${page} | Latest Robotics Updates` : 'Robot News | Latest Robotics Updates',
      description: 'Read daily robot news, robotics funding updates, product launches, and AI robot industry highlights.',
      url: `${SITE_URL}${canonicalPath}`
    }
  }
}

export default async function NewsPage({ searchParams }: { searchParams?: { page?: string; topic?: string } }) {
  const news = await getNews()
  return (
    <NewsClient initialNews={news} initialPage={searchParams?.page} initialTopic={searchParams?.topic} />
  )
}
