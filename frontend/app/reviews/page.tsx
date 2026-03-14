import type { Metadata } from 'next'
import { getArticles } from '../../lib/api'
import ReviewsClient from './ReviewsClient'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

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
  const articles = await getArticles({
    preferApi: true,
    ignoreStatic: true,
    apiBaseOverride: 'https://robot-portal-api.onrender.com'
  })
  return (
    <ReviewsClient initialArticles={articles} />
  )
}
