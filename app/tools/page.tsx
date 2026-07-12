'use client'
import { useRouter } from 'next/navigation'
import { Wrench, ArrowLeft } from 'lucide-react'
import AppHeader from '../../components/AppHeader'

export default function ToolsPage() {
  const router = useRouter()
  return (
    <div className="page-fade-in" style={{ minHeight: '100svh', background: 'var(--bg)', paddingBottom: 96 }}>
      <AppHeader variant="detail" title="Tools" onBack={() => router.back()} />
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: 'var(--surf-inset)', border: '1.5px solid var(--border-card)',
          display: 'grid', placeItems: 'center', margin: '0 auto 24px',
        }}>
          <Wrench size={28} strokeWidth={1.75} color="var(--text-muted)" />
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 10 }}>
          Coming soon
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', lineHeight: 1.65, maxWidth: 280, margin: '0 auto' }}>
          Compliance tools and resources are on their way. Check back soon.
        </div>
      </div>
    </div>
  )
}
