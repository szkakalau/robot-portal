import Link from 'next/link'
import { getArticles } from '../../lib/api'

export default async function ReviewsPage() {
  const articles = await getArticles()
  const reviews = articles.filter((a:any)=>a.category==='review' || a.category==='guide')
  return (
    <div>
      <h1>机器人评测</h1>
      <ul>
        {reviews.map((a:any)=>(
          <li key={a.slug}><Link href={`/article/${a.slug}`}>{a.title}</Link></li>
        ))}
      </ul>
    </div>
  )
}
