import type { Metadata } from 'next'
import Link from 'next/link'
import { getNews } from '../../lib/api'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const PAGE_SIZE = 20

function toPositiveInt(value?: string, fallback: number = 1) {
  const parsed = Number(value || '')
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.floor(parsed)
}

export async function generateMetadata({ searchParams }: { searchParams?: { page?: string } }): Promise<Metadata> {
  const page = toPositiveInt(searchParams?.page, 1)
  const canonicalPath = page > 1 ? `/news?page=${page}` : '/news'
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

export default async function NewsPage({ searchParams }: { searchParams?: { page?: string } }) {
  const page = toPositiveInt(searchParams?.page, 1)
  const news = await getNews()
  const totalPages = Math.max(1, Math.ceil(news.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = news.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  return (
    <div>
      <h1>Robot News</h1>
      <ul>
        {pageItems.map((n:any)=>(
          <li key={n.link} style={{marginBottom:8}}>
            <a href={n.link} target="_blank" rel="noopener noreferrer">{n.title}</a> {n.source ? `· ${n.source}`:''}
          </li>
        ))}
      </ul>
      <nav style={{display:'flex', gap:12, marginTop:16}}>
        {safePage > 1 ? <Link href={safePage - 1 === 1 ? '/news' : `/news?page=${safePage - 1}`}>Previous</Link> : <span>Previous</span>}
        <span>Page {safePage} / {totalPages}</span>
        {safePage < totalPages ? <Link href={`/news?page=${safePage + 1}`}>Next</Link> : <span>Next</span>}
      </nav>
    </div>
  )
}
