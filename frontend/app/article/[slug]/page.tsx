import Link from 'next/link'
import Image from 'next/image'
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

function splitSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+/g)
    .map((s) => s.trim())
    .filter(Boolean)
}

function pickBullets(sentences: string[], keywords: string[], fallback: string[]) {
  const hits = sentences.filter((s) => keywords.some((k) => s.toLowerCase().includes(k)))
  const deduped = Array.from(new Set(hits)).slice(0, 3)
  if (deduped.length > 0) return deduped
  return fallback.slice(0, 3)
}

function whoForFromTitle(title: string) {
  const text = title.toLowerCase()
  if (text.includes("kids") || text.includes("toy")) return ["Parents and educators", "STEM classrooms", "Family gifting"]
  if (text.includes("pet") || text.includes("companion")) return ["Home users", "Seniors and caregivers", "Companion seekers"]
  if (text.includes("warehouse") || text.includes("logistics")) return ["Operations teams", "Warehouse automation", "Logistics leaders"]
  if (text.includes("humanoid")) return ["Enterprise R&D", "Robotics labs", "Manufacturing leaders"]
  return ["Builders and operators", "Product teams", "Robotics enthusiasts"]
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
  const sentences = splitSentences(content)
  const wordCount = content ? content.split(/\s+/).filter(Boolean).length : 0
  const readingMinutes = Math.max(3, Math.round(wordCount / 200))
  const publishedDate = formatDate(article.created_at)
  const articleImage = article.image_url || buildImageUrl(displayTitle || article.slug) || `${SITE_URL}/og-default.png`
  const quoteText = pickQuote(article.meta_description, paragraphs)
  const summaryText = article.meta_description || paragraphs[0] || ''
  const whatItIs = paragraphs[0] || summaryText
  const howItWorks = paragraphs[1] || paragraphs[0] || summaryText
  const pros = pickBullets(sentences, ['advantage', 'strong', 'efficient', 'reliable', 'best', 'improve'], [
    'Balanced performance across core tasks',
    'Clear positioning versus adjacent platforms',
    'Practical deployment considerations addressed'
  ])
  const cons = pickBullets(sentences, ['however', 'but', 'limitation', 'risk', 'challenge', 'cost', 'expensive', 'complex'], [
    'Requires careful setup and tuning',
    'Cost can rise with advanced configurations',
    'Early-stage ecosystem maturity'
  ])
  const whoFor = whoForFromTitle(displayTitle)
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
          <Image
            src={articleImage}
            alt={displayTitle}
            width={1200}
            height={675}
            sizes="(max-width: 980px) 100vw, 50vw"
            style={{ width: '100%', height: 'auto' }}
          />
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
          <div className="article-aside-card">
            <div className="article-aside-title">Explore</div>
            <Link className="article-share" href="/robots">Robot Database</Link>
            <Link className="article-share" href="/topic/robot-dog">Robot Dogs</Link>
            <Link className="article-share" href="/topic/ai-robot">AI Robots</Link>
            <Link className="article-share" href="/topic/robot-toys">Robot Toys</Link>
          </div>
        </aside>
        <div className="article-content">
        {(article.category === 'review' || article.category === 'guide') && (
          <section className="review-blocks">
            <div className="review-card">
              <div className="review-title">What it is</div>
              <p>{whatItIs}</p>
            </div>
            <div className="review-card">
              <div className="review-title">How it works</div>
              <p>{howItWorks}</p>
            </div>
            <div className="review-card">
              <div className="review-title">Summary</div>
              <p>{summaryText}</p>
            </div>
            <div className="review-card">
              <div className="review-title">Pros</div>
              <ul>
                {pros.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="review-card">
              <div className="review-title">Cons</div>
              <ul>
                {cons.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="review-card">
              <div className="review-title">Who it’s for</div>
              <ul>
                {whoFor.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>
        )}
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
