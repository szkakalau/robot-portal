import { getNews } from '../../lib/api'

export default async function NewsPage() {
  const news = await getNews()
  return (
    <div>
      <h1>机器人新闻</h1>
      <ul>
        {news.map((n:any)=>(
          <li key={n.link} style={{marginBottom:8}}>
            <a href={n.link} target="_blank">{n.title}</a> {n.source ? `· ${n.source}`:''}
          </li>
        ))}
      </ul>
    </div>
  )
}
