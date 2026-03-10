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

function splitDropcap(text: string) {
  const match = text.match(/^(\W*)(\w)([\s\S]*)$/)
  if (!match) return { prefix: '', first: '', rest: text }
  return { prefix: match[1], first: match[2], rest: match[3] }
}

function pickQuote(meta: string | undefined, paragraphs: string[]) {
  if (meta && meta.trim()) return meta.trim()
  const candidate = paragraphs.find((p) => p.length > 80) || paragraphs[0] || ''
  const sentence = candidate.split(/(?<=[.!?])\s+/)[0] || candidate
  return sentence.trim()
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
  const section = getArticleSection(article.category)
  const articleUrl = `${SITE_URL}/article/${article.slug}`
  const displayTitle = normalizeTitle(article.title)
  const content = normalizeContent(article.content)
  const paragraphs = splitParagraphs(content)
  const wordCount = content ? content.split(/\s+/).filter(Boolean).length : 0
  const readingMinutes = Math.max(3, Math.round(wordCount / 200))
  const publishedDate = formatDate(article.created_at)
  const articleImage = article.image_url || buildImageUrl(displayTitle || article.slug) || `${SITE_URL}/og-default.png`
  const quoteText = pickQuote(article.meta_description, paragraphs)
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
      { '@type': 'ListItem', position: 2, name: section.name, item: `${SITE_URL}${section.href}` },
      { '@type': 'ListItem', position: 3, name: displayTitle, item: articleUrl }
    ]
  }
  return (
    <article className="article-shell article-magazine">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <nav className="article-breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href={section.href}>{section.name}</Link>
        <span>/</span>
        <span>{displayTitle}</span>
      </nav>
      <section className="article-hero">
        <div className="article-hero-copy">
          <div className="article-kicker">
            <span className="chip">{article.category || 'review'}</span>
            {publishedDate && <span className="article-meta">{publishedDate}</span>}
            <span className="article-meta">{readingMinutes} min read</span>
          </div>
          <h1 className="article-title">{displayTitle}</h1>
          <p className="article-lede">{article.meta_description || 'Robotics analysis written for teams shipping real hardware.'}</p>
          <div className="article-meta-row">
            <span className="article-meta">Mechaverses Editorial Team</span>
            {publishedDate && <span className="article-meta">Updated {publishedDate}</span>}
          </div>
        </div>
        <div className="article-hero-media">
          <img src={articleImage} alt={displayTitle} />
        </div>
      </section>
      <section className="article-grid">
        <aside className="article-aside">
          <div className="article-aside-card">
            <div className="article-aside-title">Article Brief</div>
            <div className="article-aside-item">
              <span>Section</span>
              <span>{section.name}</span>
            </div>
            <div className="article-aside-item">
              <span>Words</span>
              <span>{wordCount.toLocaleString()}</span>
            </div>
            <div className="article-aside-item">
              <span>Format</span>
              <span>Long-form</span>
            </div>
          </div>
          <div className="article-aside-card">
            <div className="article-aside-title">Share</div>
            <a className="article-share" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(displayTitle)}&url=${encodeURIComponent(articleUrl)}`} target="_blank" rel="noopener noreferrer">Post on X</a>
            <a className="article-share" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`} target="_blank" rel="noopener noreferrer">Share on LinkedIn</a>
          </div>
        </aside>
        <div className="article-content">
        {paragraphs.length > 0 ? paragraphs.flatMap((p, idx) => {
          const blocks: JSX.Element[] = []
          if (idx === 0) {
            const dropcap = splitDropcap(p)
            blocks.push(
              <p key={`${article.slug}-${idx}`} className="article-lead">
                {dropcap.prefix}
                <span className="article-dropcap">{dropcap.first}</span>
                {dropcap.rest}
              </p>
            )
          } else {
            blocks.push(<p key={`${article.slug}-${idx}`}>{p}</p>)
          }
          if ((idx === 1 || idx === 4) && quoteText) {
            blocks.push(
              <div className="article-pullquote" key={`${article.slug}-quote-${idx}`}>
                <span>“{quoteText}”</span>
              </div>
            )
          }
          if (idx > 0 && idx % 3 === 0) {
            blocks.push(<div className="article-divider" key={`${article.slug}-divider-${idx}`} />)
          }
          return blocks
        }) : <p className="article-lead">{content}</p>}
        </div>
      </section>
    </article>
  )
}
