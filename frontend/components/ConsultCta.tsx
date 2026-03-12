 'use client'

 import { useState, type FormEvent } from 'react'

 type ConsultCtaProps = {
   source: string
 }

 export default function ConsultCta({ source }: ConsultCtaProps) {
   const [form, setForm] = useState({ name: '', email: '', company: '', message: '' })
   const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
   const [note, setNote] = useState('')
   const apiBase = process.env.NEXT_PUBLIC_API_BASE || ''

   const onChange = (key: keyof typeof form, value: string) => {
     setForm((prev) => ({ ...prev, [key]: value }))
   }

   const track = async (event: string) => {
     try {
       await fetch(`${apiBase}/events`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ event, source, page: window.location.pathname })
       })
     } catch {}
   }

   const submit = async (e: FormEvent) => {
     e.preventDefault()
     setStatus('loading')
     await track('cta_click')
     try {
       const res = await fetch(`${apiBase}/leads`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ ...form, source, page: window.location.pathname })
       })
       const data = await res.json()
       if (!res.ok) throw new Error(data?.detail || 'Submission failed')
       await track('cta_submit')
       setStatus('success')
       setNote('Thanks. We will reach out within 2 business days.')
       setForm({ name: '', email: '', company: '', message: '' })
     } catch (err: any) {
       setStatus('error')
       setNote(err?.message || 'Submission failed')
     }
   }

   return (
     <section className="section-card">
       <h2 className="section-title">Talk to our robotics team</h2>
       <p className="section-subtitle">Request a shortlist, ROI estimate, or integration guidance.</p>
       <form className="form-grid" onSubmit={submit}>
         <input placeholder="Name" value={form.name} onChange={(e) => onChange('name', e.target.value)} required />
         <input type="email" placeholder="Work email" value={form.email} onChange={(e) => onChange('email', e.target.value)} required />
         <input placeholder="Company" value={form.company} onChange={(e) => onChange('company', e.target.value)} />
         <input placeholder="What are you evaluating?" value={form.message} onChange={(e) => onChange('message', e.target.value)} />
         <button type="submit" className="button">Request consultation</button>
       </form>
       {status !== 'idle' && (
         <div className="card-meta">{note}</div>
       )}
     </section>
   )
 }
