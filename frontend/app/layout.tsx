import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Robot Portal',
    template: '%s | Robot Portal'
  },
  description: 'Robotics news, product reviews, and a searchable robot database.',
  alternates: {
    canonical: '/'
  },
  openGraph: {
    siteName: 'Robot Portal',
    type: 'website',
    locale: 'en_US'
  },
  twitter: {
    card: 'summary_large_image'
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
              <a className="brand" href="/">Robot Portal</a>
              <nav className="nav-links">
                <a href="/news">Robot News</a>
                <a href="/reviews">Robot Reviews</a>
                <a href="/robots">Robot Database</a>
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
