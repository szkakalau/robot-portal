import Link from 'next/link'
import { getArticles, getRobots, getNews } from '../lib/api'

export default async function Home() {
  const [articles, robots, news] = await Promise.all([getArticles(), getRobots(), getNews()])
  return (
    <div>
      <section>
        <h1 style={{fontSize:32, fontWeight:700}}>Robot Portal</h1>
        <p>专注机器人新闻、评测与数据库</p>
      </section>
      <section>
        <h2>Trending Robots</h2>
        <ul>
          {robots.slice(0,4).map((r:any)=>(
            <li key={r.id || r.name}>{r.name} {r.company ? `- ${r.company}`:''}</li>
          ))}
        </ul>
      </section>
      <section>
        <h2>Latest News</h2>
        <ul>
          {news.slice(0,5).map((n:any)=>(
            <li key={n.link}><a href={n.link} target="_blank">{n.title}</a></li>
          ))}
        </ul>
      </section>
      <section>
        <h2>Robot Reviews</h2>
        <ul>
          {articles.filter((a:any)=>a.category==='review').slice(0,5).map((a:any)=>(
            <li key={a.slug}><Link href={`/article/${a.slug}`}>{a.title}</Link></li>
          ))}
        </ul>
      </section>
    </div>
  )
}
