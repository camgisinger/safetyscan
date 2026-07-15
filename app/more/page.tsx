'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../lib/UserContext'
import { useCount } from '../../lib/CountContext'
import AppHeader from '../../components/AppHeader'
import { House, Layers, Folder, TriangleAlert, BookOpen, LifeBuoy, LogOut, ChevronRight, Settings } from 'lucide-react'

function toInitials(name: string | null, email: string | null) {
  if (name) return name.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return email ? email[0].toUpperCase() : 'U'
}

function NavRow({ icon, label, badge, onClick }: { icon: React.ReactNode; label: string; badge?: number; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 18px', background: 'none', border: 'none',
      cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
    }}>
      <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: 'var(--text)', letterSpacing: '-0.01em' }}>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span style={{
          minWidth: 20, height: 20, borderRadius: 999,
          background: 'var(--issue)', color: '#fff',
          fontSize: 11, fontWeight: 700,
          display: 'grid', placeItems: 'center', padding: '0 4px',
        }}>{badge > 99 ? '99+' : badge}</span>
      )}
      <ChevronRight size={16} strokeWidth={1.75} color="var(--text-muted)" />
    </button>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ padding: '18px 18px 6px', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        {title}
      </div>
      <div style={{ background: 'var(--surf)', border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-card)', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}

function Divider() {
  return <div style={{ height: '1.5px', background: 'var(--border-subtle)', margin: '0 18px' }} />
}

export default function MorePage() {
  const [signingOut, setSigningOut] = useState(false)
  const [branding, setBranding] = useState<{ company_name: string | null; logo_url: string | null } | null>(null)
  const router = useRouter()
  const { user } = useUser()
  const { outstandingCount } = useCount()

  const fullName = user?.user_metadata?.full_name ?? null
  const email = user?.email ?? null

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('company_name, logo_url').eq('id', user.id).single()
      .then(({ data }) => { if (data) setBranding(data) })
  }, [user])

  const handleSignOut = async () => {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="page-fade-in" style={{ minHeight: '100svh', background: 'var(--bg)', paddingBottom: 96 }}>
      <AppHeader title="More" />

      <div style={{ maxWidth: 540, margin: '0 auto', padding: '16px 0 0' }}>

        {/* Account card */}
        <button onClick={() => router.push('/profile/edit')} style={{
          margin: '0 18px 16px', width: 'calc(100% - 36px)',
          background: 'var(--surf)', border: '1.5px solid var(--border-card)',
          borderRadius: 'var(--r-card)', padding: '16px 18px',
          display: 'flex', alignItems: 'center', gap: 14,
          cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
        }}>
          <div style={{
            width: 46, height: 46, borderRadius: '50%',
            background: 'var(--amber)', flexShrink: 0,
            display: 'grid', placeItems: 'center',
            fontSize: 17, fontWeight: 700, color: '#1B1A12',
          }}>
            {toInitials(fullName, email)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}>
              {fullName || email || '…'}
            </div>
            {email && fullName && (
              <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                {email}
              </div>
            )}
          </div>
          <ChevronRight size={16} strokeWidth={1.75} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        </button>

        {/* Organisation branding card */}
        <button onClick={() => router.push('/profile/branding')} style={{
          margin: '0 18px 8px', width: 'calc(100% - 36px)',
          background: 'var(--surf)', border: '1.5px solid var(--border-card)',
          borderRadius: 'var(--r-card)', padding: '14px 18px',
          display: 'flex', alignItems: 'center', gap: 14,
          cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10, flexShrink: 0, overflow: 'hidden',
            background: 'var(--bg)', border: '1.5px solid var(--border-card)',
            display: 'grid', placeItems: 'center',
          }}>
            {branding?.logo_url ? (
              <img src={branding.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="6.5" width="14" height="10" rx="1.5" stroke="var(--text-muted)" strokeWidth="1.4"/>
                <path d="M6 16.5v-4h2.5v4M9.5 16.5v-4h2.5v4" stroke="var(--text-muted)" strokeWidth="1.4" strokeLinecap="round"/>
                <path d="M5.5 6.5V5C5.5 3.9 6.4 3 7.5 3h3C11.6 3 12.5 3.9 12.5 5v1.5" stroke="var(--text-muted)" strokeWidth="1.4"/>
              </svg>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
              {branding?.company_name || 'Organisation Branding'}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-muted)', marginTop: 2 }}>
              {branding?.company_name ? 'PDF exports & reports' : 'Add logo & details for PDF exports'}
            </div>
          </div>
          <ChevronRight size={16} strokeWidth={1.75} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        </button>

        {/* Get around */}
        <Section title="Get around">
          <NavRow icon={<House size={18} strokeWidth={1.75} />} label="Home" onClick={() => router.push('/dashboard')} />
          <Divider />
          <NavRow icon={<Layers size={18} strokeWidth={1.75} />} label="Scans" onClick={() => router.push('/scans')} />
          <Divider />
          <NavRow icon={<Folder size={18} strokeWidth={1.75} />} label="Sites" onClick={() => router.push('/sites')} />
          <Divider />
          <NavRow icon={<TriangleAlert size={18} strokeWidth={1.75} />} label="Issues" badge={outstandingCount ?? 0} onClick={() => router.push('/issues')} />
          <Divider />
          <NavRow icon={<Settings size={18} strokeWidth={1.75} />} label="Settings" onClick={() => router.push('/settings')} />
        </Section>

        {/* Help */}
        <Section title="Help &amp; preferences">
          <NavRow icon={<BookOpen size={18} strokeWidth={1.75} />} label="Guide" onClick={() => router.push('/guide')} />
          <Divider />
          <NavRow icon={<LifeBuoy size={18} strokeWidth={1.75} />} label="Help &amp; support" onClick={() => router.push('/contact')} />
        </Section>

        {/* Sign out */}
        <div style={{ margin: '8px 18px 0' }}>
          <button onClick={handleSignOut} disabled={signingOut} style={{
            width: '100%', height: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
            background: 'var(--surf)', border: '1.5px solid var(--border-card)',
            borderRadius: 'var(--r-card)', cursor: 'pointer', fontFamily: 'inherit',
            color: 'var(--issue)', fontSize: 15, fontWeight: 600,
            opacity: signingOut ? 0.5 : 1,
          }}>
            <LogOut size={17} strokeWidth={2} />
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>
    </div>
  )
}
