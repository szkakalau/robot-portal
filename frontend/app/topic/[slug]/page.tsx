import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getArticles, getRobots } from '../../../lib/api'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

type TopicConfig = {
  slug: string
  title: string
  description: string
  category?: string
  keywords: string[]
}

const TOPICS: TopicConfig[] = [
  {
    slug: 'robot-dog',
    title: 'Robot Dog Guide: Best Robot Dogs and Reviews',
    description: 'Explore robot dog products, reviews, and buying guidance for home, enterprise, and R&D teams.',
    category: 'robot dog',
    keywords: ['robot dog', 'best robot dog', 'robot dog price', 'ai robot dog', 'robot dog review']
  },
  {
    slug: 'ai-robot',
    title: 'AI Robot Guide: Trends, Reviews, and Picks',
    description: 'Coverage of AI robots, embodied intelligence, and the most relevant products to compare.',
    category: 'humanoid robot',
    keywords: ['ai robot', 'ai robotics', 'embodied ai', 'robot assistant', 'smart robot']
  },
  {
    slug: 'robot-toys',
    title: 'Robot Toys Guide: Best Picks for Kids and Adults',
    description: 'Find the best robot toys with AI, coding, and STEM learning features.',
    category: 'education robot',
    keywords: ['robot toys', 'best robot toys', 'robot toys with ai', 'robot toys for kids', 'robot gadgets']
  },
  {
    slug: 'best-robot-dog-under-1000',
    title: 'Best Robot Dog Under $1000',
    description: 'Affordable robot dog options under $1000 with real-world pros, cons, and use cases.',
    category: 'robot dog',
    keywords: ['best robot dog under 1000', 'cheap robot dog', 'robot dog budget', 'robot dog price']
  },
  {
    slug: 'best-robot-toys-for-kids-2026',
    title: 'Best Robot Toys for Kids 2026',
    description: '2026 shortlist of robot toys for kids with STEM learning value and safety considerations.',
    category: 'education robot',
    keywords: ['best robot toys for kids 2026', 'robot toys for kids', 'stem robot toys', 'kids robot guide']
  }
]

const PAGE_SIZE = 12

function getTopic(slug: string) {
  return TOPICS.find((topic) => topic.slug === slug)
}

function toPositiveInt(value?: string, fallback: number = 1) {
  const parsed = Number(value || '')
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.floor(parsed)
}

function buildFaq(topic: TopicConfig) {
  const [primary, secondary, tertiary] = topic.keywords
  return [
    {
      q: `What is the best ${primary} in 2026?`,
      a: `The best ${primary} depends on your budget, use case, and support expectations. Use this hub to compare top models, pricing, and real-world fit.`
    },
    {
      q: `How much does a ${primary} cost?`,
      a: `Pricing varies widely. Entry models can start in the low hundreds, while enterprise-grade options cost tens of thousands. This page highlights both.`
    },
    {
      q: `What should I look for when choosing ${secondary || primary}?`,
      a: `Prioritize reliability, vendor support, deployment complexity, and total cost of ownership. Compare specs, case studies, and maintenance needs.`
    },
    {
      q: `Are there alternatives to ${tertiary || primary}?`,
      a: `Yes. Related categories often provide similar outcomes with different tradeoffs. Explore the related robots and reviews below for alternatives.`
    }
  ]
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const topic = getTopic(params.slug)
  if (!topic) return { title: 'Topic | Mechaverses' }
  const canonicalPath = `/topic/${topic.slug}`
  return {
    title: `${topic.title} | Mechaverses`,
    description: topic.description,
    alternates: {
      canonical: canonicalPath
    },
    openGraph: {
      title: `${topic.title} | Mechaverses`,
      description: topic.description,
      url: `${SITE_URL}${canonicalPath}`
    },
    twitter: {
      card: 'summary_large_image',
      title: `${topic.title} | Mechaverses`,
      description: topic.description
    }
  }
}

export default async function TopicPage({ params, searchParams }: { params: { slug: string }, searchParams?: { page?: string } }) {
  const topic = getTopic(params.slug)
  if (!topic) notFound()
  const page = toPositiveInt(searchParams?.page, 1)
  const [robots, articles] = await Promise.all([getRobots({ limit: 200 }), getArticles()])
  const relatedRobots = topic.category
    ? robots.filter((r: any) => `${r.category || ''}`.toLowerCase() === topic.category).slice(0, 6)
    : robots.slice(0, 6)
  const keywordMatches = articles.filter((a: any) => topic.keywords.some((k) => `${a.title || ''} ${a.meta_description || ''}`.toLowerCase().includes(k.split(' ')[0])))
  const fallbackArticles = articles.filter((a: any) => `${a.category || ''}`.toLowerCase().includes('review') || `${a.category || ''}`.toLowerCase().includes('guide'))
  const merged = [...keywordMatches, ...fallbackArticles, ...articles].filter((a: any, idx: number, arr: any[]) => a?.slug && arr.findIndex((b) => b.slug === a.slug) === idx)
  const totalPages = Math.max(1, Math.ceil(merged.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = merged.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const visibleArticles = pageItems.length >= 8 ? pageItems : merged.slice(0, 8)
  const faqItems = buildFaq(topic)
  return (
    <div className="section">
      <section className="section">
        <h1 className="section-title">{topic.title}</h1>
        <p className="section-subtitle">{topic.description}</p>
      </section>
      <section className="section">
        <h2 className="section-title">Keyword Focus</h2>
        <div className="list">
          <div className="card" style={{display:'flex', flexWrap:'wrap', gap:8}}>
            {topic.keywords.map((keyword) => (
              <span className="chip" key={keyword}>{keyword}</span>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <h2 className="section-title">Robots to Compare</h2>
        <div className="grid-3">
          {relatedRobots.map((robot: any) => (
            <Link className="card" key={robot.id || robot.name} href={`/robots/${encodeURIComponent(robot.name)}`}>
              <div className="chip">{robot.category || 'robot'}</div>
              <h3 className="card-title">{robot.name}</h3>
              <p className="card-description">{robot.description || 'Explore specs, pricing, and positioning.'}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="section">
        <h2 className="section-title">Reviews & Guides</h2>
        <div className="grid-2">
          {visibleArticles.map((article: any) => (
            <Link className="card" key={article.slug} href={`/article/${article.slug}`}>
              <div className="chip">{article.category || 'review'}</div>
              <h3 className="card-title">{article.title}</h3>
              <p className="card-description">{article.meta_description || 'Read the analysis and key takeaways.'}</p>
            </Link>
          ))}
        </div>
        <div className="card-meta">Page {safePage} / {totalPages}</div>
        <div style={{display:'flex', gap:12}}>
          {safePage > 1 ? <Link className="button button-ghost" href={`/topic/${topic.slug}?page=${safePage - 1}`}>Previous</Link> : <span className="button button-ghost">Previous</span>}
          {safePage < totalPages ? <Link className="button button-ghost" href={`/topic/${topic.slug}?page=${safePage + 1}`}>Next</Link> : <span className="button button-ghost">Next</span>}
          <Link className="button button-ghost" href="/reviews">Browse all reviews</Link>
        </div>
      </section>
      <section className="section">
        <h2 className="section-title">FAQ</h2>
        <div className="list">
          {faqItems.map((item) => (
            <div className="card" key={item.q}>
              <h3 className="card-title">{item.q}</h3>
              <p className="card-description">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
