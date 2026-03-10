import Link from 'next/link'
import type { Metadata } from 'next'
import { getArticle } from '../../../lib/api'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

function getArticleSection(category?: string) {
  const value = (category || '').toLowerCase()
  if (value === 'news') return { name: 'Robot News', href: '/news' }
  if (value === 'review' || value === 'guide') return { name: 'Robot Reviews', href: '/reviews' }
  return { name: 'Articles', href: '/reviews' }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await getArticle(params.slug)
  const title = article.seo_title || `${article.title} | Robot Portal`
  const description = article.meta_description || `Read ${article.title} on Robot Portal.`
  const canonicalPath = `/article/${article.slug}`
  const image = article.image_url || `${SITE_URL}/og-default.png`
  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${SITE_URL}${canonicalPath}`,
      images: [{ url: image }]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image]
    }
  }
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug)
  const section = getArticleSection(article.category)
  const articleUrl = `${SITE_URL}/article/${article.slug}`
  const articleImage = article.image_url || `${SITE_URL}/og-default.png`
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    articleSection: article.category,
    description: article.meta_description || undefined,
    datePublished: article.created_at || undefined,
    dateModified: article.created_at || undefined,
    inLanguage: 'en',
    mainEntityOfPage: articleUrl,
    image: articleImage,
    author: {
      '@type': 'Organization',
      name: 'Robot Portal Editorial Team'
    },
    isPartOf: {
      '@type': 'WebSite',
      name: 'Robot Portal',
      url: SITE_URL
    },
    publisher: {
      '@type': 'Organization',
      name: 'Robot Portal'
    }
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: section.name, item: `${SITE_URL}${section.href}` },
      { '@type': 'ListItem', position: 3, name: article.title, item: articleUrl }
    ]
  }
  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <nav style={{display:'flex', gap:8, marginBottom:12}}>
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href={section.href}>{section.name}</Link>
        <span>/</span>
        <span>{article.title}</span>
      </nav>
      <h1>{article.title}</h1>
      <div style={{whiteSpace:'pre-wrap'}}>{article.content}</div>
    </article>
  )
}
