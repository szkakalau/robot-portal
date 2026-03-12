import Link from 'next/link'
import type { Metadata } from 'next'
import { getArticles, getRobots, getNews } from '../lib/api'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Mechaverses | Robotics News, Reviews and Database',
  description: 'Explore robotics news, robot product reviews, and a growing robot database for consumers and builders.',
  openGraph: {
    title: 'Mechaverses | Robotics News, Reviews and Database',
    description: 'Explore robotics news, robot product reviews, and a growing robot database for consumers and builders.',
    url: '/'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mechaverses | Robotics News, Reviews and Database',
    description: 'Explore robotics news, robot product reviews, and a growing robot database for consumers and builders.'
  }
}

function normalizeTitle(value?: string) {
  if (!value) return ''
  return value.replace(/^\s*title\s*:\s*/i, '').replace(/\*\*/g, '').trim()
}

export default async function Home() {
  const [articles, robots, news] = await Promise.all([getArticles(), getRobots(), getNews()])
  const reviewItems = articles.filter((a:any)=>a.category==='review' || a.category==='guide')
  const featuredArticles = (reviewItems.length > 0 ? reviewItems : articles).slice(0, 6)
  return (
    <div className="section">
      <section className="hero">
        <div>
          <h1 className="hero-title">Robotics coverage with a pulse.</h1>
          <p className="hero-text">Daily robot news, long-form reviews, and a living product database for builders, buyers, and investors.</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/reviews">Read reviews</Link>
            <Link className="button button-ghost" href="/robots">Browse robots</Link>
          </div>
        </div>
        <div className="hero-panel">
          <div className="metric-card">
            <div className="metric-number">{reviewItems.length}</div>
            <div className="metric-label">Reviews & Guides</div>
          </div>
          <div className="metric-card">
            <div className="metric-number">{robots.length}</div>
            <div className="metric-label">Robots tracked</div>
          </div>
          <div className="metric-card">
            <div className="metric-number">{news.length}</div>
            <div className="metric-label">Live news sources</div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Featured Insights</h2>
        <p className="section-subtitle">Editor-curated analysis for builders and operators.</p>
        <div className="grid-2">
          {featuredArticles.map((a:any)=>(
            <Link className="card" key={a.slug} href={`/article/${a.slug}`}>
              <div className="chip">{a.category || 'review'}</div>
              <h3 className="card-title">{normalizeTitle(a.title)}</h3>
              <p className="card-description">{a.meta_description || 'Read the analysis and key takeaways.'}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Trending Robots</h2>
        <p className="section-subtitle">What builders and buyers are comparing this week.</p>
        <div className="grid-3">
          {robots.slice(0,3).map((r:any)=>(
            <div className="card" key={r.id || r.name}>
              <div className="chip">{r.category || 'robotics'}</div>
              <h3 className="card-title">{r.name}</h3>
              <p className="card-description">{r.description || 'High-visibility robot platform with rapid iteration cycles.'}</p>
              <div className="card-meta">{r.company || 'Independent lab'}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Latest News</h2>
        <p className="section-subtitle">Signals and funding moves shaping robotics right now.</p>
        <div className="list">
          {news.slice(0,5).map((n:any)=>(
            <a className="card" key={n.link} href={n.link} target="_blank" rel="noopener noreferrer">
              <div className="card-meta">{n.source || 'Newswire'}</div>
              <h3 className="card-title">{n.title}</h3>
              <p className="card-description">Open external source →</p>
            </a>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Robot Reviews</h2>
        <p className="section-subtitle">Deep dives written for people shipping robots.</p>
        <div className="grid-2">
          {reviewItems.slice(0,4).map((a:any)=>(
            <Link className="card" key={a.slug} href={`/article/${a.slug}`}>
              <div className="chip">{a.category || 'review'}</div>
              <h3 className="card-title">{normalizeTitle(a.title)}</h3>
              <p className="card-description">{a.meta_description || 'Read the full review for specs, positioning, and competitive takeaways.'}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
