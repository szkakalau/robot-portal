import Link from 'next/link'
import type { Metadata } from 'next'
import { getRobots } from '../../lib/api'
import ComparePanel from './ComparePanel'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const PAGE_SIZE = 24

type SearchParams = {
  category?: string
  company?: string
  q?: string
  min_price?: string
  max_price?: string
  price_band?: string
  rating?: string
  page?: string
}

function toPositiveInt(value?: string, fallback: number = 1) {
  const parsed = Number(value || '')
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.floor(parsed)
}

function buildQuery(params: Record<string, string>) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v.trim() !== '') qs.set(k, v)
  })
  return qs.toString()
}

export async function generateMetadata({ searchParams }: { searchParams?: SearchParams }): Promise<Metadata> {
  const page = toPositiveInt(searchParams?.page, 1)
  const canonicalQuery = buildQuery({
    category: searchParams?.category || '',
    company: searchParams?.company || '',
    q: searchParams?.q || '',
    min_price: searchParams?.min_price || '',
    max_price: searchParams?.max_price || '',
    price_band: searchParams?.price_band || '',
    rating: searchParams?.rating || '',
    page: page > 1 ? String(page) : ''
  })
  const canonicalPath = canonicalQuery ? `/robots?${canonicalQuery}` : '/robots'
  return {
    title: page > 1 ? `Robot Database - Page ${page} | Browse 200+ Robots` : 'Robot Database | Browse 200+ Robots',
    description: 'Browse robot profiles by category, company, and price. Explore specs and compare robot products in one searchable database.',
    alternates: {
      canonical: canonicalPath
    },
    openGraph: {
      title: page > 1 ? `Robot Database - Page ${page} | Browse 200+ Robots` : 'Robot Database | Browse 200+ Robots',
      description: 'Browse robot profiles by category, company, and price. Explore specs and compare robot products in one searchable database.',
      url: `${SITE_URL}${canonicalPath}`
    }
  }
}

export default async function RobotsPage({ searchParams }: { searchParams?: SearchParams }) {
  const page = toPositiveInt(searchParams?.page, 1)
  const priceBand = searchParams?.price_band || ''
  const ratingFilter = searchParams?.rating || ''
  const filters = {
    category: searchParams?.category || '',
    company: searchParams?.company || '',
    q: searchParams?.q || '',
    min_price: searchParams?.min_price || '',
    max_price: searchParams?.max_price || '',
    limit: 500
  }
  const robots = await getRobots(filters, {
    preferApi: true,
    ignoreStatic: true,
    apiBaseOverride: 'https://robot-portal-api.onrender.com'
  })
  const filtered = robots.filter((robot: any) => {
    const price = Number(robot.price)
    if (priceBand === 'under-1000' && (!(price >= 0) || price >= 1000)) return false
    if (priceBand === '1000-5000' && (!(price >= 1000) || price > 5000)) return false
    if (priceBand === '5000-20000' && (!(price >= 5000) || price > 20000)) return false
    if (priceBand === '20000-plus' && (!(price >= 20000))) return false
    if (ratingFilter) {
      const rank = Number(robot?.specs?.rank)
      const base = Number.isFinite(rank) ? Math.max(3, Math.min(5, 5 - rank / 50)) : 4
      if (ratingFilter === '4plus' && base < 4) return false
      if (ratingFilter === '3plus' && base < 3.5) return false
    }
    return true
  })
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE
  const pageItems = filtered.slice(start, end)
  const featured = [...filtered]
    .sort((a: any, b: any) => {
      const ar = Number(a?.specs?.rank)
      const br = Number(b?.specs?.rank)
      if (Number.isFinite(ar) && Number.isFinite(br)) return ar - br
      if (Number.isFinite(ar)) return -1
      if (Number.isFinite(br)) return 1
      return Number(b.price || 0) - Number(a.price || 0)
    })
    .slice(0, 6)
  const linkBaseQuery = buildQuery({
    category: filters.category,
    company: filters.company,
    q: filters.q,
    min_price: filters.min_price,
    max_price: filters.max_price,
    price_band: priceBand,
    rating: ratingFilter
  })
  const prevPageQuery = buildQuery({
    category: filters.category,
    company: filters.company,
    q: filters.q,
    min_price: filters.min_price,
    max_price: filters.max_price,
    price_band: priceBand,
    rating: ratingFilter,
    page: safePage > 2 ? String(safePage - 1) : ''
  })
  const nextPageQuery = buildQuery({
    category: filters.category,
    company: filters.company,
    q: filters.q,
    min_price: filters.min_price,
    max_price: filters.max_price,
    price_band: priceBand,
    rating: ratingFilter,
    page: safePage < totalPages ? String(safePage + 1) : ''
  })
  return (
    <div className="section">
      <section className="page-header">
        <div>
          <h1 className="page-title">Robot Database</h1>
          <p className="page-lede">Filter by category, company, and price to find your next build platform.</p>
        </div>
        <div className="stat-row">
          <div className="stat">
            <div className="stat-value">{total}</div>
            <div className="stat-label">Robots found</div>
          </div>
          <div className="stat">
            <div className="stat-value">{safePage}</div>
            <div className="stat-label">Page {safePage} of {totalPages}</div>
          </div>
        </div>
      </section>
      <section className="section">
        <h2 className="section-title">Editor Picks</h2>
        <p className="section-subtitle">Highest-interest robots based on category rank and demand.</p>
        <div className="grid-3">
          {featured.map((robot: any) => (
            <Link className="card" key={robot.id || robot.name} href={`/robots/${encodeURIComponent(robot.name)}`}>
              <div className="chip">{robot.category || 'robot'}</div>
              <h3 className="card-title">{robot.name}</h3>
              <p className="card-description">{robot.description || 'Explore specs, pricing, and positioning.'}</p>
              <div className="card-meta">{robot.company || 'Independent lab'}</div>
            </Link>
          ))}
        </div>
      </section>
      <section className="section-card">
        <h2 className="section-title">Topic Pages</h2>
        <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
          <Link className="chip" href="/topic/robot-dog">Robot Dogs</Link>
          <Link className="chip" href="/topic/ai-robot">AI Robots</Link>
          <Link className="chip" href="/topic/robot-toys">Robot Toys</Link>
          <Link className="chip" href="/topic/best-robot-dog-under-1000">Best Robot Dog Under $1000</Link>
          <Link className="chip" href="/topic/best-robot-toys-for-kids-2026">Best Robot Toys for Kids 2026</Link>
        </div>
      </section>
      <form method="get" className="section-card form-grid">
        <input name="q" defaultValue={filters.q} placeholder="Keyword" />
        <input name="category" defaultValue={filters.category} placeholder="Category" />
        <input name="company" defaultValue={filters.company} placeholder="Company" />
        <input name="min_price" defaultValue={filters.min_price} placeholder="Min Price" />
        <input name="max_price" defaultValue={filters.max_price} placeholder="Max Price" />
        <select name="price_band" defaultValue={priceBand}>
          <option value="">Price band</option>
          <option value="under-1000">Under $1000</option>
          <option value="1000-5000">$1000–$5000</option>
          <option value="5000-20000">$5000–$20000</option>
          <option value="20000-plus">$20000+</option>
        </select>
        <select name="rating" defaultValue={ratingFilter}>
          <option value="">Rating</option>
          <option value="4plus">4.0+</option>
          <option value="3plus">3.5+</option>
        </select>
        <button className="button" type="submit">Filter</button>
        <Link className="button button-ghost" href="/robots">Reset</Link>
      </form>
      <ComparePanel items={pageItems} />
      <nav className="section-card" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        {safePage > 1 ? <Link className="data-link" href={prevPageQuery ? `/robots?${prevPageQuery}` : '/robots'}>Previous</Link> : <span className="data-meta">Previous</span>}
        <span className="data-meta">Page {safePage} / {totalPages}</span>
        {safePage < totalPages ? <Link className="data-link" href={nextPageQuery ? `/robots?${nextPageQuery}` : '/robots'}>Next</Link> : <span className="data-meta">Next</span>}
      </nav>
      {linkBaseQuery && <div className="card-meta">Filtered view</div>}
    </div>
  )
}
