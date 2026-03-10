import Link from 'next/link'
import type { Metadata } from 'next'
import { getRobotByName, getRobots } from '../../../lib/api'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export async function generateMetadata({ params }: { params: { name: string } }): Promise<Metadata> {
  const name = decodeURIComponent(params.name)
  const robot = await getRobotByName(name)
  const path = `/robots/${encodeURIComponent(robot.name)}`
  const title = `${robot.name} Review, Specs and Price | Robot Portal`
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
    <article style={{display:'grid', gap:12}}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <nav style={{display:'flex', gap:8}}>
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/robots">Robot Database</Link>
        <span>/</span>
        <span>{robot.name}</span>
      </nav>
      <Link href="/robots">← Back to Robot Database</Link>
      <h1>{robot.name}</h1>
      <p>{robot.description || 'No description available yet.'}</p>
      <table style={{width:'100%', borderCollapse:'collapse'}}>
        <tbody>
          <tr><td>Company</td><td>{robot.company || '-'}</td></tr>
          <tr><td>Category</td><td>{robot.category || '-'}</td></tr>
          <tr><td>Price</td><td>{robot.price || '-'}</td></tr>
          <tr><td>Release Year</td><td>{robot.release_year || '-'}</td></tr>
        </tbody>
      </table>
      <section>
        <h2>SEO Fields</h2>
        <pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(robot.specs || {}, null, 2)}</pre>
      </section>
      {related.length > 0 && (
        <section>
          <h2>Related Robots</h2>
          <ul>
            {related.map((item: any) => (
              <li key={item.id || item.name}>
                <Link href={`/robots/${encodeURIComponent(item.name)}`}>{item.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
