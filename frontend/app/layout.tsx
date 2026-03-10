import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Mechaverses',
    template: '%s | Mechaverses'
  },
  description: 'Mechaverses delivers robotics news, product reviews, and a searchable robot database.',
  alternates: {
    canonical: '/'
  },
  keywords: [
    'robotics news',
    'robot reviews',
    'robot database',
    'AI robots',
    'service robots',
    'humanoid robots'
  ],
  openGraph: {
    siteName: 'Mechaverses',
    title: 'Mechaverses',
    description: 'Robotics news, reviews, and a searchable robot database.',
    url: SITE_URL,
    type: 'website',
    locale: 'en_US'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mechaverses',
    description: 'Robotics news, reviews, and a searchable robot database.'
  }
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="page">
          <div className="bg-orb orb-1" />
          <div className="bg-orb orb-2" />
          <header className="site-header">
            <div className="nav-wrap">
              <a className="brand" href="/">mechaverses.com</a>
              <nav className="nav-links">
                <a href="/news">Robot News</a>
                <a href="/reviews">Robot Reviews</a>
                <a href="/robots">Robot Database</a>
                <a href="/search">Search</a>
              </nav>
              <a className="nav-cta" href="/reviews">Explore Reviews</a>
            </div>
          </header>
          <main className="main">
            {children}
          </main>
          <footer className="footer">Robotics intelligence, curated daily.</footer>
        </div>
      </body>
    </html>
  )
}
