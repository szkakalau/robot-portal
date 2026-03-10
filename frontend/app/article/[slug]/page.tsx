import Link from 'next/link'
import type { Metadata } from 'next'
import { getArticle } from '../../../lib/api'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

function normalizeTitle(value?: string) {
  if (!value) return ''
  return value.replace(/^\s*title\s*:\s*/i, '').replace(/\*\*/g, '').trim()
}

function normalizeContent(value?: string) {
  if (!value) return ''
  const cleaned = value.replace(/\*\*/g, '')
  const lines = cleaned.split('\n').filter((line) => line.trim() !== '')
  if (lines.length > 0 && /^\s*title\s*:\s*/i.test(lines[0])) {
    lines.shift()
  }
  return lines.join('\n').trim()
}

function buildImageUrl(title: string) {
  const prompt = encodeURIComponent(`cinematic robotics concept art, ${title}, photorealistic, dramatic lighting, ultra-detailed`)
  return `https://image.pollinations.ai/prompt/${prompt}?width=1200&height=675&seed=${encodeURIComponent(title)}`
}

function getArticleSection(category?: string) {
  const value = (category || '').toLowerCase()
  if (value === 'news') return { name: 'Robot News', href: '/news' }
  if (value === 'review' || value === 'guide') return { name: 'Robot Reviews', href: '/reviews' }
  return { name: 'Articles', href: '/reviews' }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await getArticle(params.slug)
  const displayTitle = normalizeTitle(article.title)
  const seoTitle = normalizeTitle(article.seo_title) || `${displayTitle} | Robot Portal`
  const description = article.meta_description || `Read ${displayTitle} on Robot Portal.`
  const canonicalPath = `/article/${article.slug}`
  const image = article.image_url || buildImageUrl(displayTitle || article.slug) || `${SITE_URL}/og-default.png`
  return {
    title: seoTitle,
    description,
    alternates: {
      canonical: canonicalPath
    },
    openGraph: {
      title: seoTitle,
      description,
      type: 'article',
      url: `${SITE_URL}${canonicalPath}`,
      images: [{ url: image }]
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description,
      images: [image]
    }
  }
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug)
  const section = getArticleSection(article.category)
  const articleUrl = `${SITE_URL}/article/${article.slug}`
  const displayTitle = normalizeTitle(article.title)
  const content = normalizeContent(article.content)
  const paragraphs = content ? content.split(/\n\s*\n+/g) : []
  const articleImage = article.image_url || buildImageUrl(displayTitle || article.slug) || `${SITE_URL}/og-default.png`
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: displayTitle,
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
      { '@type': 'ListItem', position: 3, name: displayTitle, item: articleUrl }
    ]
  }
  return (
    <article className="article-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <nav className="card" style={{display:'flex', gap:8, alignItems:'center'}}>
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href={section.href}>{section.name}</Link>
        <span>/</span>
        <span>{displayTitle}</span>
      </nav>
      <section className="card">
        <div className="chip">{article.category || 'review'}</div>
        <h1 className="hero-title">{displayTitle}</h1>
        <p className="section-subtitle">{article.meta_description || 'Robotics analysis written for teams shipping real hardware.'}</p>
        <div className="article-image">
          <img src={articleImage} alt={displayTitle} />
        </div>
      </section>
      <div className="article-body">
        {paragraphs.length > 0 ? paragraphs.map((p, idx) => (
          <p key={`${article.slug}-${idx}`} style={{margin:0, lineHeight:1.8}}>{p}</p>
        )) : <p style={{margin:0, lineHeight:1.8}}>{content}</p>}
      </div>
    </article>
  )
}
