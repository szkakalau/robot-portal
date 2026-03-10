import Link from 'next/link'
import type { Metadata } from 'next'
import { getArticles } from '../../lib/api'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const PAGE_SIZE = 20

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
  const page = toPositiveInt(searchParams?.page, 1)
  const articles = await getArticles()
  const reviews = articles.filter((a:any)=>a.category==='review' || a.category==='guide')
  const visible = reviews.length > 0 ? reviews : articles
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  return (
    <div className="section">
      <section className="section">
        <h1 className="section-title">Robot Reviews</h1>
        <p className="section-subtitle">Long-form evaluations, guides, and competitive analysis.</p>
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
      <nav className="list">
        <div className="card" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          {safePage > 1 ? <Link href={safePage - 1 === 1 ? '/reviews' : `/reviews?page=${safePage - 1}`}>Previous</Link> : <span>Previous</span>}
          <span className="card-meta">Page {safePage} / {totalPages}</span>
          {safePage < totalPages ? <Link href={`/reviews?page=${safePage + 1}`}>Next</Link> : <span>Next</span>}
        </div>
      </nav>
    </div>
  )
}
