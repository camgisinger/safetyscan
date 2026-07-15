'use client'
import { useRouter } from 'next/navigation'
import AppHeader from '../../components/AppHeader'
import ContactForm from '../../components/ContactForm'

export default function ContactPageContent() {
  const router = useRouter()
  return (
    <div className="page-fade-in" style={{ minHeight: '100svh', background: 'var(--bg)', paddingBottom: 96 }}>
      <AppHeader variant="detail" onBack={() => router.back()} title="Contact us" />
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 18px 0' }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24, marginTop: 0 }}>
          Have a question or feedback? Fill in the form below and we'll get back to you.
        </p>
        <ContactForm />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '28px 0 8px' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-card)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Looking for answers?
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-card)' }} />
        </div>
        <button onClick={() => router.push('/faqs')} style={{
          width: '100%', height: 46, borderRadius: 'var(--r-control)',
          border: '1.5px solid var(--border-card)', background: 'var(--surf)',
          color: 'var(--text)', fontSize: 14, fontWeight: 600,
          fontFamily: 'inherit', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          Browse FAQs
        </button>
      </div>
    </div>
  )
}
