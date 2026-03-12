 'use client'

 import { useState, type FormEvent } from 'react'

 type SubscribeFormProps = {
   source: string
 }

 export default function SubscribeForm({ source }: SubscribeFormProps) {
   const [email, setEmail] = useState('')
   const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
   const [message, setMessage] = useState('')
   const apiBase = process.env.NEXT_PUBLIC_API_BASE || ''

   const submit = async (e: FormEvent) => {
     e.preventDefault()
     if (!email) return
     setStatus('loading')
     try {
       const res = await fetch(`${apiBase}/subscriptions`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ email, source, page: window.location.pathname })
       })
       const data = await res.json()
       if (!res.ok) throw new Error(data?.detail || 'Subscribe failed')
       setStatus('success')
       setMessage('Subscribed. Check your inbox for the weekly digest.')
       setEmail('')
     } catch (err: any) {
       setStatus('error')
       setMessage(err?.message || 'Subscribe failed')
     }
   }

   return (
     <section className="section-card">
       <h2 className="section-title">Get the Weekly Robotics Digest</h2>
       <p className="section-subtitle">One email per week with the best reviews, news, and product updates.</p>
       <form className="form-grid" onSubmit={submit}>
         <input
           type="email"
           name="email"
           placeholder="Email address"
           value={email}
           onChange={(e) => setEmail(e.target.value)}
           required
         />
         <button type="submit" className="button">Subscribe</button>
       </form>
       {status !== 'idle' && (
         <div className="card-meta">{message}</div>
       )}
     </section>
   )
 }
