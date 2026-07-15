'use client'
import { useRouter } from 'next/navigation'
import AppHeader from '../../components/AppHeader'
import ContactForm from '../../components/ContactForm'

export default function SupportPageContent() {
  const router = useRouter()

  return (
    <div className="page-fade-in" style={{ minHeight: '100svh', background: 'var(--bg)', paddingBottom: 96 }}>
      <AppHeader variant="detail" onBack={() => router.back()} title="Support" />
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 18px 0' }}>

        {/* FAQs banner */}
        <div
          onClick={() => router.push('/faqs')}
          style={{
            display: 'flex', alignItems: 'center', gap: 16,
            background: 'var(--surf)', border: '1.5px solid var(--border-card)',
            borderRadius: 'var(--r-card)', padding: '16px 18px',
            cursor: 'pointer', marginBottom: 28,
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: 'var(--brand-tint)',
            display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 2 }}>
              Browse FAQs
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Find answers to common questions about scans, sites, and results
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>

        {/* Divider with label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-card)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Or contact us
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-card)' }} />
        </div>

        <ContactForm />
      </div>
    </div>
  )
}
