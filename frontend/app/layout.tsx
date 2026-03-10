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
        <header style={{padding:'16px', borderBottom:'1px solid #eee'}}>
          <nav style={{display:'flex', gap:16}}>
            <a href="/">Home</a>
            <a href="/news">Robot News</a>
            <a href="/reviews">Robot Reviews</a>
            <a href="/robots">Robot Database</a>
          </nav>
        </header>
        <main style={{maxWidth:960, margin:'0 auto', padding:'24px'}}>
          {children}
        </main>
      </body>
    </html>
  )
}
