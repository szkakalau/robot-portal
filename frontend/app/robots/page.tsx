import Link from 'next/link'
import type { Metadata } from 'next'
import { getRobots } from '../../lib/api'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const PAGE_SIZE = 24

type SearchParams = {
  category?: string
  company?: string
  q?: string
  min_price?: string
  max_price?: string
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
  const filters = {
    category: searchParams?.category || '',
    company: searchParams?.company || '',
    q: searchParams?.q || '',
    min_price: searchParams?.min_price || '',
    max_price: searchParams?.max_price || '',
    limit: 500
  }
  const robots = await getRobots(filters)
  const total = robots.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE
  const pageItems = robots.slice(start, end)
  const linkBaseQuery = buildQuery({
    category: filters.category,
    company: filters.company,
    q: filters.q,
    min_price: filters.min_price,
    max_price: filters.max_price
  })
  const prevPageQuery = buildQuery({
    category: filters.category,
    company: filters.company,
    q: filters.q,
    min_price: filters.min_price,
    max_price: filters.max_price,
    page: safePage > 2 ? String(safePage - 1) : ''
  })
  const nextPageQuery = buildQuery({
    category: filters.category,
    company: filters.company,
    q: filters.q,
    min_price: filters.min_price,
    max_price: filters.max_price,
    page: safePage < totalPages ? String(safePage + 1) : ''
  })
  return (
    <div>
      <h1>Robot Database</h1>
      <form method="get" style={{display:'grid', gridTemplateColumns:'repeat(5, minmax(120px, 1fr))', gap:12, marginBottom:16}}>
        <input name="q" defaultValue={filters.q} placeholder="Keyword" />
        <input name="category" defaultValue={filters.category} placeholder="Category" />
        <input name="company" defaultValue={filters.company} placeholder="Company" />
        <input name="min_price" defaultValue={filters.min_price} placeholder="Min Price" />
        <input name="max_price" defaultValue={filters.max_price} placeholder="Max Price" />
        <button type="submit" style={{gridColumn:'span 2'}}>Filter</button>
        <Link href="/robots">Reset</Link>
      </form>
      <p>{total} robots found</p>
      <table style={{width:'100%', borderCollapse:'collapse'}}>
        <thead>
          <tr>
            <th style={{textAlign:'left'}}>Name</th>
            <th style={{textAlign:'left'}}>Company</th>
            <th style={{textAlign:'left'}}>Category</th>
            <th style={{textAlign:'left'}}>Price</th>
          </tr>
        </thead>
        <tbody>
          {pageItems.map((r:any)=>(
            <tr key={r.id || r.name}>
              <td>
                <Link href={`/robots/${encodeURIComponent(r.name)}`}>{r.name}</Link>
              </td>
              <td>{r.company || '-'}</td>
              <td>{r.category || '-'}</td>
              <td>{r.price || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <nav style={{display:'flex', gap:12, marginTop:16}}>
        {safePage > 1 ? <Link href={prevPageQuery ? `/robots?${prevPageQuery}` : '/robots'}>Previous</Link> : <span>Previous</span>}
        <span>Page {safePage} / {totalPages}</span>
        {safePage < totalPages ? <Link href={nextPageQuery ? `/robots?${nextPageQuery}` : '/robots'}>Next</Link> : <span>Next</span>}
      </nav>
      {linkBaseQuery && <p style={{marginTop:8}}>Filtered view</p>}
    </div>
  )
}
