import Link from 'next/link'
import type { Metadata } from 'next'
import { getArticles } from '../../lib/api'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const PAGE_SIZE = 20

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
  const totalPages = Math.max(1, Math.ceil(reviews.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = reviews.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  return (
    <div>
      <h1>Robot Reviews</h1>
      <ul>
        {pageItems.map((a:any)=>(
          <li key={a.slug}><Link href={`/article/${a.slug}`}>{a.title}</Link></li>
        ))}
      </ul>
      <nav style={{display:'flex', gap:12, marginTop:16}}>
        {safePage > 1 ? <Link href={safePage - 1 === 1 ? '/reviews' : `/reviews?page=${safePage - 1}`}>Previous</Link> : <span>Previous</span>}
        <span>Page {safePage} / {totalPages}</span>
        {safePage < totalPages ? <Link href={`/reviews?page=${safePage + 1}`}>Next</Link> : <span>Next</span>}
      </nav>
    </div>
  )
}
