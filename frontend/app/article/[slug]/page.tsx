import { getArticle } from '../../../lib/api'

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug)
  return (
    <article>
      <h1>{article.title}</h1>
      <div style={{whiteSpace:'pre-wrap'}}>{article.content}</div>
    </article>
  )
}
