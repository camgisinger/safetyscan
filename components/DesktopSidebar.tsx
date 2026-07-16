'use client'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { House, Layers, Folder, TriangleAlert, Camera, Wrench, Settings, LifeBuoy } from 'lucide-react'
import { useUser } from '../lib/UserContext'
import { useCount } from '../lib/CountContext'
import { supabase } from '../lib/supabase'
import ThemeToggle from './ThemeToggle'

type NavId = 'home' | 'scans' | 'sites' | 'issues' | 'tools' | 'settings' | 'support'

const APP_ROOTS = ['/dashboard', '/scans', '/sites', '/issues', '/profile', '/settings', '/tools', '/scan', '/guide', '/support', '/privacy', '/terms', '/help']

const NAV: { id: NavId; label: string; href: string; Icon: any }[] = [
  { id: 'home',   label: 'Home',   href: '/dashboard', Icon: House },
  { id: 'scans',  label: 'Scans',  href: '/scans',     Icon: Layers },
  { id: 'sites',  label: 'Sites',  href: '/sites',     Icon: Folder },
  { id: 'issues', label: 'Issues', href: '/issues',    Icon: TriangleAlert },
  { id: 'tools',  label: 'Tools',  href: '/tools',     Icon: Wrench },
]

const BOTTOM_NAV: { id: NavId; label: string; href: string; Icon: any }[] = [
  { id: 'settings', label: 'Settings', href: '/settings', Icon: Settings },
  { id: 'support',  label: 'Support',  href: '/support',  Icon: LifeBuoy },
]

function toInitials(name: string | null, email: string | null) {
  if (name) return name.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return email ? email[0].toUpperCase() : 'U'
}

function toDisplayName(name: string | null, email: string | null) {
  if (name) {
    const parts = name.trim().split(/\s+/)
    return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0]
  }
  return email ?? ''
}

function activeId(pathname: string): NavId | null {
  if (pathname === '/dashboard')         return 'home'
  if (pathname.startsWith('/scans'))     return 'scans'
  if (pathname.startsWith('/sites'))     return 'sites'
  if (pathname.startsWith('/issues'))    return 'issues'
  if (pathname.startsWith('/tools'))     return 'tools'
  if (pathname.startsWith('/settings') || pathname.startsWith('/profile')) return 'settings'
  if (pathname.startsWith('/support'))   return 'support'
  return null
}

export default function DesktopSidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { user } = useUser()
  const { outstandingCount } = useCount()

  const fullName = user?.user_metadata?.full_name ?? null
  const email    = user?.email ?? null
  const [companyName, setCompanyName] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('company_name').eq('id', user.id).single()
      .then(({ data }) => { if (data?.company_name) setCompanyName(data.company_name) })
  }, [user])

  const active = activeId(pathname)

  if (!APP_ROOTS.some(r => pathname === r || pathname.startsWith(r + '/'))) return null

  return (
    <aside
      className="desktop-sidebar"
      style={{
        width: 244, flexShrink: 0,
        background: 'var(--surf-sidebar)',
        borderRight: '1.5px solid var(--div)',
        flexDirection: 'column',
        height: '100vh', position: 'sticky', top: 0,
        overflowY: 'auto',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '24px 20px 16px' }}>
        <button onClick={() => router.push('/dashboard')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--amber)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <img src="/brand/mark-black-white.png" alt="" style={{ width: 30, height: 30 }} />
          </div>
          <span style={{ fontWeight: 600, fontSize: 19.5, letterSpacing: '-0.02em', color: 'var(--text)' }}>Site<b style={{ fontWeight: 700, color: 'var(--amber)' }}>Spotter</b></span>
        </button>
      </div>

      {/* New scan */}
      <div style={{ padding: '0 12px 16px' }}>
        <button onClick={() => router.push('/scan/new')} style={{
          width: '100%', height: 40, borderRadius: 'var(--r-control)',
          background: 'var(--amber)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          color: '#fff', fontWeight: 700, fontSize: 13.5, fontFamily: 'inherit',
          boxShadow: 'var(--shadow-btn)',
        }}>
          <Camera size={15} strokeWidth={2.2} />
          New scan
        </button>
      </div>

      {/* Nav */}
      <nav style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ id, label, href, Icon }) => {
          const on    = active === id
          const badge = id === 'issues' ? (outstandingCount ?? 0) : 0
          return (
            <button key={id} onClick={() => router.push(href)} style={{
              width: '100%', height: 38, borderRadius: 10,
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '0 12px',
              background: on ? 'var(--brand-tint)' : 'transparent',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              color: on ? 'var(--amber)' : 'var(--text-secondary)',
              fontWeight: on ? 700 : 500, fontSize: 14,
            }}>
              <Icon size={16} strokeWidth={on ? 2.2 : 1.75} />
              <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
              {badge > 0 && (
                <span style={{
                  minWidth: 18, height: 18, borderRadius: 999,
                  background: 'var(--issue)', color: '#fff',
                  fontSize: 10.5, fontWeight: 700,
                  display: 'grid', placeItems: 'center', padding: '0 4px',
                }}>
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div style={{ flex: 1 }} />

      {/* Bottom nav — Settings & Support */}
      <nav style={{ padding: '0 8px 4px', display: 'flex', flexDirection: 'column', gap: 2, borderTop: '1.5px solid var(--div)', paddingTop: 8 }}>
        {BOTTOM_NAV.map(({ id, label, href, Icon }) => {
          const on = active === id
          return (
            <button key={id} onClick={() => router.push(href)} style={{
              width: '100%', height: 36, borderRadius: 10,
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '0 12px',
              background: on ? 'var(--brand-tint)' : 'transparent',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              color: on ? 'var(--amber)' : 'var(--text-secondary)',
              fontWeight: on ? 700 : 500, fontSize: 13.5,
            }}>
              <Icon size={15} strokeWidth={on ? 2.2 : 1.75} />
              <span>{label}</span>
            </button>
          )
        })}
      </nav>

      {/* Account row */}
      <div style={{ borderTop: '1.5px solid var(--div)', padding: '10px 8px 16px', display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => router.push('/settings')} style={{
          flex: 1, minWidth: 0, padding: '8px 12px', borderRadius: 10,
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--amber)', flexShrink: 0,
            display: 'grid', placeItems: 'center',
            fontSize: 12, fontWeight: 700, color: '#1B1A12',
          }}>
            {toInitials(fullName, email)}
          </div>
          <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {fullName || email || ''}
            </div>
            {companyName && (
              <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                {companyName}
              </div>
            )}
          </div>
        </button>
        <ThemeToggle compact />
      </div>
    </aside>
  )
}
