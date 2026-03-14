 'use client'
 
 import Link from 'next/link'
 import { useEffect, useMemo, useState } from 'react'
 
 type Article = {
   slug: string
   title?: string
   content?: string
   meta_description?: string
   category?: string
   source_url?: string | null
   source_title?: string | null
 }
 
 const TOPICS = [
   { slug: 'robot-dog', label: 'Robot Dogs' },
   { slug: 'ai-robot', label: 'AI Robots' },
   { slug: 'robot-toys', label: 'Robot Toys' },
   { slug: 'best-robot-dog-under-1000', label: 'Best Robot Dog Under $1000' },
   { slug: 'best-robot-toys-for-kids-2026', label: 'Best Robot Toys for Kids 2026' }
 ]
 
 function normalizeTitle(value?: string) {
   if (!value) return ''
   return value.replace(/^\s*title\s*:\s*/i, '').replace(/\*\*/g, '').trim()
 }
 
 function buildExcerpt(value?: string) {
   if (!value) return ''
   return value.replace(/\s+/g, ' ').trim().slice(0, 160)
 }
 
 async function fetchArticles() {
   const r = await fetch('https://robot-portal-api.onrender.com/articles', { cache: 'no-store' })
   if (!r.ok) throw new Error(`HTTP ${r.status}`)
   return r.json()
 }
 
 export default function ReviewsClient({ initialArticles }: { initialArticles: Article[] }) {
   const [articles, setArticles] = useState<Article[]>(initialArticles || [])
 
   useEffect(() => {
     let cancelled = false
     const run = async () => {
       if (Array.isArray(initialArticles) && initialArticles.length > 0) return
       for (let attempt = 0; attempt < 5; attempt += 1) {
         try {
           const data = await fetchArticles()
           if (!cancelled && Array.isArray(data)) {
             setArticles(data)
           }
           return
         } catch {
           await new Promise((r) => setTimeout(r, 1500 + attempt * 1500))
         }
       }
     }
     run()
     return () => {
       cancelled = true
     }
   }, [initialArticles])
 
   const reviews = useMemo(
     () => (articles || []).filter((a: any) => a.category === 'review' || a.category === 'guide'),
     [articles]
   )
   const featured = useMemo(() => (reviews.length > 0 ? reviews : articles).slice(0, 6), [reviews, articles])
   const pageItems = articles || []
 
   return (
     <div className="section">
       <section className="page-header">
         <div>
           <h1 className="page-title">Robot Reviews</h1>
           <p className="page-lede">Long-form evaluations, guides, and competitive analysis.</p>
         </div>
         <div className="stat-row">
           <div className="stat">
             <div className="stat-value">{pageItems.length}</div>
             <div className="stat-label">Total articles</div>
           </div>
         </div>
       </section>
       <section className="section">
         <h2 className="section-title">Editor Picks</h2>
         <p className="section-subtitle">Top reviews and guides for this week.</p>
         <div className="grid-2">
           {featured.map((a: any) => (
             <div className="card" key={a.slug}>
               <div className="chip">{a.category || 'review'}</div>
               <h3 className="card-title">
                 <Link href={`/article/${a.slug}`}>{normalizeTitle(a.title)}</Link>
               </h3>
               <p className="card-description">
                 {buildExcerpt(a.meta_description || a.content) || 'Read the full review for specs, positioning, and takeaways.'}
               </p>
               {a.source_url && (
                 <a className="data-link" href={a.source_url} target="_blank" rel="noopener noreferrer">
                   Source{a.source_title ? `: ${a.source_title}` : ''}
                 </a>
               )}
             </div>
           ))}
         </div>
       </section>
       <section className="section-card">
         <h2 className="section-title">Topic Pages</h2>
         <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
           {TOPICS.map((topic) => (
             <Link className="chip" key={topic.slug} href={`/topic/${topic.slug}`}>
               {topic.label}
             </Link>
           ))}
         </div>
       </section>
       <div className="grid-2">
         {pageItems.map((a: any) => (
           <div className="card" key={a.slug}>
             <div className="chip">{a.category || 'review'}</div>
             <h2 className="card-title">
               <Link href={`/article/${a.slug}`}>{normalizeTitle(a.title)}</Link>
             </h2>
             <p className="card-description">
               {buildExcerpt(a.meta_description || a.content) || 'Read the full review for specs, positioning, and takeaways.'}
             </p>
             {a.source_url && (
               <a className="data-link" href={a.source_url} target="_blank" rel="noopener noreferrer">
                 Source{a.source_title ? `: ${a.source_title}` : ''}
               </a>
             )}
           </div>
         ))}
       </div>
       <div className="card-meta">{pageItems.length} reviews loaded</div>
     </div>
   )
 }

