'use client'
import AppHeader from '../../components/AppHeader'
import ContactForm from '../../components/ContactForm'

export default function ContactPageContent() {
  return (
    <div className="page-fade-in" style={{ minHeight: '100svh', background: 'var(--bg)', paddingBottom: 96 }}>
      <AppHeader title="Contact us" />
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 18px 0' }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24, marginTop: 0 }}>
          Have a question or feedback? Fill in the form below and we'll get back to you.
        </p>
        <ContactForm />
      </div>
    </div>
  )
}
