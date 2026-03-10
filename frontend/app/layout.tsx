import './globals.css'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'Robot Portal',
  description: 'Robotics news, reviews, and database'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <header style={{padding:'16px', borderBottom:'1px solid #eee'}}>
          <nav style={{display:'flex', gap:16}}>
            <a href="/">首页</a>
            <a href="/news">机器人新闻</a>
            <a href="/reviews">机器人评测</a>
            <a href="/robots">机器人数据库</a>
          </nav>
        </header>
        <main style={{maxWidth:960, margin:'0 auto', padding:'24px'}}>
          {children}
        </main>
      </body>
    </html>
  )
}
