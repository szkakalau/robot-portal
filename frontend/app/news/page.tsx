import type { Metadata } from 'next'
import Link from 'next/link'
import { getNews } from '../../lib/api'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const PAGE_SIZE = 20

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
  const page = toPositiveInt(searchParams?.page, 1)
  const topic = (searchParams?.topic || '').toLowerCase().trim()
  const news = await getNews()
  const filteredNews = topic
    ? news.filter((n: any) => {
        const tags = (n.tags || []).map((t: string) => t.toLowerCase())
        return tags.includes(topic) || `${n.category || ''}`.toLowerCase() === topic
      })
    : news
  const featured = [...filteredNews]
    .sort((a: any, b: any) => {
      const ad = new Date(a.published_at || 0).getTime()
      const bd = new Date(b.published_at || 0).getTime()
      return bd - ad
    })
    .slice(0, 6)
  const totalPages = Math.max(1, Math.ceil(filteredNews.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filteredNews.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const latest = filteredNews[0]?.published_at
  const topicCounts = new Map<string, number>()
  news.forEach((n: any) => {
    const tags = (n.tags || []).map((t: string) => t.toLowerCase())
    tags.forEach((t: string) => {
      topicCounts.set(t, (topicCounts.get(t) || 0) + 1)
    })
    const category = `${n.category || ''}`.toLowerCase()
    if (category) {
      topicCounts.set(category, (topicCounts.get(category) || 0) + 1)
    }
  })
  const topics = Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
  return (
    <div className="section">
      <section className="page-header">
        <div>
          <h1 className="page-title">Robot News</h1>
          <p className="page-lede">Funding, product launches, and research highlights from top feeds.</p>
        </div>
        <div className="stat-row">
          <div className="stat">
            <div className="stat-value">{filteredNews.length}</div>
            <div className="stat-label">Total items</div>
          </div>
          <div className="stat">
            <div className="stat-value">{latest ? 'Updated' : '—'}</div>
            <div className="stat-label">{latest || 'No data yet'}</div>
          </div>
        </div>
      </section>
      {topics.length > 0 && (
        <section className="section-card">
          <h2 className="section-title">Topics</h2>
          <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
            <Link className="chip" href="/news">All</Link>
            {topics.map(([tag, count]) => (
              <Link className="chip" key={tag} href={`/news?topic=${encodeURIComponent(tag)}`}>
                {tag} ({count})
              </Link>
            ))}
          </div>
        </section>
      )}
      <section className="section">
        <h2 className="section-title">Editor Picks</h2>
        <p className="section-subtitle">Hand-selected highlights from the latest robotics coverage.</p>
        <div className="grid-2">
          {featured.map((n: any) => (
            <a className="card" key={n.link} href={n.link} target="_blank" rel="noopener noreferrer">
              <div className="chip">{n.source || 'Newswire'}</div>
              <h3 className="card-title">{n.title}</h3>
              <p className="card-description">{n.summary_en || n.summary || 'Read at source →'}</p>
            </a>
          ))}
        </div>
      </section>
      <div className="data-list">
        {pageItems.map((n:any)=>(
          <a className="data-item" key={n.link} href={n.link} target="_blank" rel="noopener noreferrer">
            <div className="data-meta">{n.source || 'Newswire'}</div>
            <h2 className="data-title">{n.title}</h2>
            <div className="data-link">{n.summary_en || n.summary || 'Read at source'}</div>
          </a>
        ))}
      </div>
      <nav className="section-card" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        {safePage > 1 ? <Link className="data-link" href={safePage - 1 === 1 ? '/news' : `/news?page=${safePage - 1}`}>Previous</Link> : <span className="data-meta">Previous</span>}
        <span className="data-meta">Page {safePage} / {totalPages}</span>
        {safePage < totalPages ? <Link className="data-link" href={`/news?page=${safePage + 1}`}>Next</Link> : <span className="data-meta">Next</span>}
      </nav>
    </div>
  )
}
