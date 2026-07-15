'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useUser } from '../lib/UserContext'

export default function ContactForm() {
  const { user } = useUser()
  const [name, setName] = useState('')
  const [email, setEmail] = useState(user?.email || '')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) return
    setSubmitting(true)
    setError(null)
    const { error: err } = await supabase.from('contact_messages').insert({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim() || null,
      message: message.trim(),
      user_id: user?.id ?? null,
    })
    setSubmitting(false)
    if (err) { setError('Something went wrong. Please try again.'); return }
    setDone(true)
  }

  const inp: React.CSSProperties = {
    display: 'block', width: '100%', height: 46, padding: '0 14px',
    border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-input)',
    background: 'var(--surf-inset)', color: 'var(--text)',
    fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
    boxSizing: 'border-box',
  }

  if (done) return (
    <div style={{
      background: 'var(--surf)', border: '1.5px solid var(--border-card)',
      borderRadius: 'var(--r-card)', padding: '32px 24px', textAlign: 'center',
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 16, background: 'var(--pass-tint)',
        display: 'grid', placeItems: 'center', margin: '0 auto 16px',
        border: '1.5px solid var(--pass-border)',
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--pass-deep)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.02em' }}>Message sent</div>
      <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        We'll get back to you at <strong>{email}</strong> as soon as we can.
      </div>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
            Name <span style={{ color: 'var(--issue)' }}>*</span>
          </label>
          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder="Your name" required
            style={inp}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
            Email <span style={{ color: 'var(--issue)' }}>*</span>
          </label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" required
            style={inp}
          />
        </div>
      </div>

      <div>
        <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
          Subject <span style={{ fontSize: 10, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
        </label>
        <input
          value={subject} onChange={e => setSubject(e.target.value)}
          placeholder="e.g. Question about scan results"
          style={inp}
        />
      </div>

      <div>
        <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
          Message <span style={{ color: 'var(--issue)' }}>*</span>
        </label>
        <textarea
          value={message} onChange={e => setMessage(e.target.value)}
          placeholder="How can we help?" required rows={5}
          style={{
            display: 'block', width: '100%', padding: '12px 14px',
            border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-input)',
            background: 'var(--surf-inset)', color: 'var(--text)',
            fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
            lineHeight: 1.6, resize: 'vertical', boxSizing: 'border-box',
            minHeight: 120,
          }}
        />
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: 'var(--fail-tint)', border: '1.5px solid var(--issue)', borderRadius: 'var(--r-input)', fontSize: 13, fontWeight: 500, color: 'var(--issue)' }}>
          {error}
        </div>
      )}

      <button type="submit" disabled={submitting || !name.trim() || !email.trim() || !message.trim()} style={{
        height: 50, borderRadius: 'var(--r-control)', border: 'none',
        background: 'var(--amber)', color: '#1B1A12',
        fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
        cursor: submitting || !name.trim() || !email.trim() || !message.trim() ? 'not-allowed' : 'pointer',
        opacity: submitting || !name.trim() || !email.trim() || !message.trim() ? 0.5 : 1,
        boxShadow: 'var(--shadow-btn)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        {submitting ? (
          <>
            <span style={{ width: 14, height: 14, border: '2px solid rgba(27,26,18,0.3)', borderTopColor: '#1B1A12', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            Sending…
          </>
        ) : 'Send message'}
      </button>
    </form>
  )
}
