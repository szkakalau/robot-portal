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

function getTopic(slug: string) {
  return TOPICS.find((topic) => topic.slug === slug)
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

export default async function TopicPage({ params }: { params: { slug: string } }) {
  const topic = getTopic(params.slug)
  if (!topic) notFound()
  const [robots, articles] = await Promise.all([getRobots({ limit: 200 }), getArticles()])
  const relatedRobots = topic.category
    ? robots.filter((r: any) => `${r.category || ''}`.toLowerCase() === topic.category).slice(0, 6)
    : robots.slice(0, 6)
  const relatedArticles = articles
    .filter((a: any) => topic.keywords.some((k) => `${a.title || ''}`.toLowerCase().includes(k.split(' ')[0])))
    .slice(0, 6)
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
          {relatedArticles.map((article: any) => (
            <Link className="card" key={article.slug} href={`/article/${article.slug}`}>
              <div className="chip">{article.category || 'review'}</div>
              <h3 className="card-title">{article.title}</h3>
              <p className="card-description">{article.meta_description || 'Read the analysis and key takeaways.'}</p>
            </Link>
          ))}
        </div>
        <Link className="button button-ghost" href="/reviews">Browse all reviews</Link>
      </section>
    </div>
  )
}
