import Link from 'next/link'
import type { Metadata } from 'next'
import { getArticles, getRobots } from '../../lib/api'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Search | Mechaverses',
  description: 'Search Mechaverses for robots, reviews, and guides.'
}

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
