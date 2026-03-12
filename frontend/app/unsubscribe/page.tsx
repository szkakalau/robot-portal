import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Unsubscribe | Mechaverses',
  description: 'Manage your Mechaverses subscription.'
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

export default async function UnsubscribePage({ searchParams }: { searchParams?: { email?: string; token?: string } }) {
  const email = searchParams?.email || ''
  const token = searchParams?.token || ''
  let status = 'Missing unsubscribe parameters.'
  if (email && token) {
    try {
      const res = await fetch(`${API_BASE}/unsubscribe?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`, { cache: 'no-store' })
      if (res.ok) {
        status = 'You have been unsubscribed from the weekly digest.'
      } else {
        const data = await res.json()
        status = data?.detail || 'Unsubscribe failed.'
      }
    } catch {
      status = 'Unsubscribe failed.'
    }
  }
  return (
    <div className="section">
      <section className="page-header">
        <div>
          <h1 className="page-title">Unsubscribe</h1>
          <p className="page-lede">{status}</p>
        </div>
      </section>
    </div>
  )
}
