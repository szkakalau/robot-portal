import Link from 'next/link'
import type { Metadata } from 'next'
import { getRobotByName, getRobots } from '../../../lib/api'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

function buildRobotImage(name: string) {
  const prompt = encodeURIComponent(`futuristic robot product shot, ${name}, studio lighting, high detail, sleek industrial design`)
  return `https://image.pollinations.ai/prompt/${prompt}?width=1200&height=675&seed=${encodeURIComponent(name)}`
}

export async function generateMetadata({ params }: { params: { name: string } }): Promise<Metadata> {
  const name = decodeURIComponent(params.name)
  const robot = await getRobotByName(name)
  const path = `/robots/${encodeURIComponent(robot.name)}`
  const title = `${robot.name} Review, Specs and Price | Mechaverses`
  const description = robot.description || `${robot.name} profile with specs, pricing and category details.`
  return {
    title,
    description,
    alternates: {
      canonical: path
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${SITE_URL}${path}`
    }
  }
}

export default async function RobotDetailPage({ params }: { params: { name: string } }) {
  const robot = await getRobotByName(decodeURIComponent(params.name))
  const robotUrl = `${SITE_URL}/robots/${encodeURIComponent(robot.name)}`
  const heroImage = buildRobotImage(robot.name)
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: robot.name,
    brand: robot.company ? { '@type': 'Brand', name: robot.company } : undefined,
    category: robot.category || undefined,
    description: robot.description || undefined,
    releaseDate: robot.release_year ? `${robot.release_year}-01-01` : undefined,
    offers: robot.price
      ? {
          '@type': 'Offer',
          priceCurrency: 'USD',
          price: robot.price,
          availability: 'https://schema.org/InStock',
          url: robotUrl
        }
      : undefined
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${SITE_URL}/`
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Robot Database',
        item: `${SITE_URL}/robots`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: robot.name,
        item: robotUrl
      }
    ]
  }
  const related = robot.category
    ? (await getRobots({ category: robot.category, limit: 8 }))
        .filter((item: any) => item.name !== robot.name)
        .slice(0, 4)
    : []
  return (
    <article className="section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <nav className="card" style={{display:'flex', gap:8, alignItems:'center'}}>
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/robots">Robot Database</Link>
        <span>/</span>
        <span>{robot.name}</span>
      </nav>
      <Link className="button button-ghost" href="/robots">← Back to Robot Database</Link>
      <section className="card">
        <div className="chip">{robot.category || 'robot'}</div>
        <h1 className="hero-title">{robot.name}</h1>
        <p className="section-subtitle">{robot.description || 'No description available yet.'}</p>
        <div className="article-image">
          <img src={heroImage} alt={robot.name} />
        </div>
      </section>
      <section className="card">
        <h2 className="section-title">Specs Overview</h2>
        <div className="table-grid">
          <div className="table-row">
            <span>Company</span>
            <span>{robot.company || '-'}</span>
            <span>Category</span>
            <span>{robot.category || '-'}</span>
          </div>
          <div className="table-row">
            <span>Price</span>
            <span>{robot.price || '-'}</span>
            <span>Release Year</span>
            <span>{robot.release_year || '-'}</span>
          </div>
        </div>
      </section>
      <section className="card">
        <h2 className="section-title">SEO Fields</h2>
        <pre className="article-body">{JSON.stringify(robot.specs || {}, null, 2)}</pre>
      </section>
      {related.length > 0 && (
        <section className="section">
          <h2 className="section-title">Related Robots</h2>
          <div className="grid-2">
            {related.map((item: any) => (
              <Link className="card" key={item.id || item.name} href={`/robots/${encodeURIComponent(item.name)}`}>
                <div className="chip">{item.category || 'robot'}</div>
                <h3 className="card-title">{item.name}</h3>
                <p className="card-description">{item.company || 'Independent lab'}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  )
}
