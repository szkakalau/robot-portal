import Link from 'next/link'
import type { Metadata } from 'next'
import { getArticles } from '../../lib/api'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const PAGE_SIZE = 20
const TOPICS = [
  { slug: 'robot-dog', label: 'Robot Dogs' },
  { slug: 'ai-robot', label: 'AI Robots' },
  { slug: 'robot-toys', label: 'Robot Toys' },
  { slug: 'best-robot-dog-under-1000', label: 'Best Robot Dog Under $1000' },
  { slug: 'best-robot-toys-for-kids-2026', label: 'Best Robot Toys for Kids 2026' }
]

function normalizeTitle(value?: string) {
  if (!value) return ''
  return value.replace(/^\s*title\s*:\s*/i, '').replace(/\*\*/g, '').trim()
}

function buildExcerpt(value?: string) {
  if (!value) return ''
  return value.replace(/\s+/g, ' ').trim().slice(0, 160)
}

function toPositiveInt(value?: string, fallback: number = 1) {
  const parsed = Number(value || '')
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.floor(parsed)
}

export async function generateMetadata({ searchParams }: { searchParams?: { page?: string } }): Promise<Metadata> {
  const page = toPositiveInt(searchParams?.page, 1)
  const canonicalPath = page > 1 ? `/reviews?page=${page}` : '/reviews'
  return {
    title: page > 1 ? `Robot Reviews - Page ${page} | Compare Robot Products` : 'Robot Reviews | Compare Robot Products',
    description: 'Discover in-depth robot reviews, buying guides, and product comparisons across consumer and AI robotics categories.',
    alternates: {
      canonical: canonicalPath
    },
    openGraph: {
      title: page > 1 ? `Robot Reviews - Page ${page} | Compare Robot Products` : 'Robot Reviews | Compare Robot Products',
      description: 'Discover in-depth robot reviews, buying guides, and product comparisons across consumer and AI robotics categories.',
      url: `${SITE_URL}${canonicalPath}`
    }
  }
}

export default async function ReviewsPage({ searchParams }: { searchParams?: { page?: string } }) {
  const articles = await getArticles()
  const pageItems = articles
  return (
    <div className="section">
      <section className="section">
        <h1 className="section-title">Robot Reviews</h1>
        <p className="section-subtitle">Long-form evaluations, guides, and competitive analysis.</p>
      </section>
      <section className="section">
        <h2 className="section-title">Topic Pages</h2>
        <div className="list">
          <div className="card" style={{display:'flex', flexWrap:'wrap', gap:8}}>
            {TOPICS.map((topic) => (
              <Link className="chip" key={topic.slug} href={`/topic/${topic.slug}`}>{topic.label}</Link>
            ))}
          </div>
        </div>
      </section>
      <div className="grid-2">
        {pageItems.map((a:any)=>(
          <Link className="card" key={a.slug} href={`/article/${a.slug}`}>
            <div className="chip">{a.category || 'review'}</div>
            <h2 className="card-title">{normalizeTitle(a.title)}</h2>
            <p className="card-description">{buildExcerpt(a.meta_description || a.content) || 'Read the full review for specs, positioning, and takeaways.'}</p>
          </Link>
        ))}
      </div>
      <div className="card-meta">{pageItems.length} reviews loaded</div>
    </div>
  )
}
