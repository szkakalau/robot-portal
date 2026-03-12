import Link from 'next/link'
import type { Metadata } from 'next'
import { getArticles, getRobots } from '../../lib/api'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Search | Mechaverses',
  description: 'Search Mechaverses for robots, reviews, and guides.'
}

const HOT_KEYWORDS = [
  'robot dog',
  'humanoid robot',
  'ai robot',
  'robot vacuum',
  'robot toys',
  'warehouse robot',
  'delivery robot',
  'robotics funding',
  'service robot',
  'robot comparison'
]

const TOPICS = [
  { slug: 'robot-dog', label: 'Robot Dogs' },
  { slug: 'ai-robot', label: 'AI Robots' },
  { slug: 'robot-toys', label: 'Robot Toys' },
  { slug: 'best-robot-dog-under-1000', label: 'Best Robot Dog Under $1000' },
  { slug: 'best-robot-toys-for-kids-2026', label: 'Best Robot Toys for Kids 2026' }
]

function normalize(value?: string) {
  return (value || '').toLowerCase().trim()
}

export default async function SearchPage({ searchParams }: { searchParams?: { q?: string } }) {
  const query = normalize(searchParams?.q)
  const [articles, robots] = await Promise.all([getArticles(), getRobots({ limit: 500 })])
  const matchedArticles = query
    ? articles.filter((a: any) => normalize(a.title).includes(query) || normalize(a.content).includes(query))
    : articles.slice(0, 6)
  const matchedRobots = query
    ? robots.filter((r: any) => normalize(r.name).includes(query) || normalize(r.company).includes(query) || normalize(r.category).includes(query))
    : robots.slice(0, 6)
  const suggested = query
    ? HOT_KEYWORDS.filter((k) => k.includes(query)).slice(0, 6)
    : HOT_KEYWORDS.slice(0, 10)
  const noResults = query && matchedArticles.length === 0 && matchedRobots.length === 0
  const fallbackArticles = articles.slice(0, 6)
  const fallbackRobots = robots.slice(0, 6)
  return (
    <div className="section">
      <section className="page-header">
        <div>
          <h1 className="page-title">Search</h1>
          <p className="page-lede">Find robots, reviews, and guides across Mechaverses.</p>
        </div>
        <div className="stat-row">
          <div className="stat">
            <div className="stat-value">{matchedRobots.length}</div>
            <div className="stat-label">Robot matches</div>
          </div>
          <div className="stat">
            <div className="stat-value">{matchedArticles.length}</div>
            <div className="stat-label">Article matches</div>
          </div>
        </div>
      </section>
      <form method="get" className="section-card form-grid">
        <input name="q" defaultValue={searchParams?.q || ''} placeholder="Search robots, reviews, or companies" />
        <button className="button" type="submit">Search</button>
        <Link className="button button-ghost" href="/search">Reset</Link>
      </form>
      <section className="section-card">
        <h2 className="section-title">Popular Searches</h2>
        <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
          {suggested.map((keyword) => (
            <Link className="chip" key={keyword} href={`/search?q=${encodeURIComponent(keyword)}`}>{keyword}</Link>
          ))}
        </div>
      </section>
      {noResults && (
        <section className="section">
          <h2 className="section-title">No results yet — try these</h2>
          <p className="section-subtitle">Explore popular topics, robots, and reviews to keep moving.</p>
          <div className="grid-2">
            {fallbackArticles.map((article: any) => (
              <Link className="card" key={article.slug} href={`/article/${article.slug}`}>
                <div className="chip">{article.category || 'review'}</div>
                <h3 className="card-title">{article.title}</h3>
                <p className="card-description">{article.meta_description || 'Read the full analysis.'}</p>
              </Link>
            ))}
          </div>
          <div className="grid-3" style={{marginTop:16}}>
            {fallbackRobots.map((robot: any) => (
              <Link className="card" key={robot.id || robot.name} href={`/robots/${encodeURIComponent(robot.name)}`}>
                <div className="chip">{robot.category || 'robot'}</div>
                <h3 className="card-title">{robot.name}</h3>
                <p className="card-description">{robot.company || 'Independent lab'}</p>
              </Link>
            ))}
          </div>
          <div style={{display:'flex', flexWrap:'wrap', gap:8, marginTop:16}}>
            {TOPICS.map((topic) => (
              <Link className="chip" key={topic.slug} href={`/topic/${topic.slug}`}>{topic.label}</Link>
            ))}
          </div>
        </section>
      )}
      <section className="section">
        <h2 className="section-title">Robot Matches</h2>
        <div className="grid-3">
          {matchedRobots.map((robot: any) => (
            <Link className="card" key={robot.id || robot.name} href={`/robots/${encodeURIComponent(robot.name)}`}>
              <div className="chip">{robot.category || 'robot'}</div>
              <h3 className="card-title">{robot.name}</h3>
              <p className="card-description">{robot.company || 'Independent lab'}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="section">
        <h2 className="section-title">Review Matches</h2>
        <div className="grid-2">
          {matchedArticles.map((article: any) => (
            <Link className="card" key={article.slug} href={`/article/${article.slug}`}>
              <div className="chip">{article.category || 'review'}</div>
              <h3 className="card-title">{article.title}</h3>
              <p className="card-description">{article.meta_description || 'Read the full analysis.'}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
