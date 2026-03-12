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

function splitParagraphs(content: string) {
  if (!content) return []
  const blocks = content
    .split(/\n\s*\n+/g)
    .map((p) => p.trim())
    .filter(Boolean)
  if (blocks.length > 1) return blocks
  const lines = content
    .split(/\n+/g)
    .map((p) => p.trim())
    .filter(Boolean)
  if (lines.length > 1) return lines
  const sentences = content.split(/(?<=[.!?])\s+/g).filter(Boolean)
  if (sentences.length <= 1) return [content]
  const grouped: string[] = []
  let buf: string[] = []
  sentences.forEach((sentence, idx) => {
    buf.push(sentence)
    if (buf.length >= 3 || idx === sentences.length - 1) {
      grouped.push(buf.join(' '))
      buf = []
    }
  })
  return grouped
}

function buildImageUrl(title: string) {
  const prompt = encodeURIComponent(`cinematic robotics concept art, ${title}, photorealistic, dramatic lighting, ultra-detailed`)
  return `https://image.pollinations.ai/prompt/${prompt}?width=1200&height=675&seed=${encodeURIComponent(title)}`
}

function formatDate(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await getArticle(params.slug)
  const displayTitle = normalizeTitle(article.title)
  const seoTitle = normalizeTitle(article.seo_title) || `${displayTitle} | Mechaverses`
  const description = article.meta_description || `Read ${displayTitle} on Mechaverses.`
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
  const displayTitle = normalizeTitle(article.title)
  const content = normalizeContent(article.content)
  const paragraphs = splitParagraphs(content)
  const publishedDate = formatDate(article.created_at)
  const articleUrl = `${SITE_URL}/article/${article.slug}`
  const articleImage = article.image_url || buildImageUrl(displayTitle || article.slug) || `${SITE_URL}/og-default.png`
  const summaryText = article.meta_description || paragraphs[0] || ''
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
      name: 'Mechaverses Editorial Team'
    },
    isPartOf: {
      '@type': 'WebSite',
      name: 'Mechaverses',
      url: SITE_URL
    },
    publisher: {
      '@type': 'Organization',
      name: 'Mechaverses'
    }
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Articles', item: `${SITE_URL}/reviews` },
      { '@type': 'ListItem', position: 3, name: displayTitle, item: articleUrl }
    ]
  }
  return (
    <article className="article-shell article-simple">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <div className="article-meta-row article-meta-simple">
        <span className="chip chip-primary">{article.category || 'review'}</span>
        {publishedDate && <span className="article-meta">{publishedDate}</span>}
      </div>
      <h1 className="article-title">{displayTitle}</h1>
      <p className="article-lede article-summary">{summaryText}</p>
      <div className="article-content article-body">
        {paragraphs.length > 0 ? paragraphs.map((p, idx) => (
          <p key={`${article.slug}-${idx}`}>{p}</p>
        )) : <p>{content}</p>}
      </div>
    </article>
  )
}
