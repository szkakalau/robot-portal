import type { Metadata } from 'next'
import { getRobots } from '../../lib/api'
import RobotsClient from './RobotsClient'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
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
  return (
    <RobotsClient initialRobots={robots} initialSearchParams={searchParams} />
  )
}
