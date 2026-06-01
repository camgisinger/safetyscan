'use client'
import { useRouter, usePathname } from 'next/navigation'

const NAV_ICONS = {
  home: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 11.5L12 4.5l8 7V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-8.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  scans: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M5 8V6a2 2 0 0 1 2-2h2M19 8V6a2 2 0 0 0-2-2h-2M5 16v2a2 2 0 0 0 2 2h2M19 16v2a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M4 12h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  sites: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  profile: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 20c1-3.5 4-5.5 7-5.5s6 2 7 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
}

const tabs = [
  { id: 'home',    label: 'HOME',    href: '/dashboard' },
  { id: 'scans',   label: 'SCANS',   href: '/scans' },
  { id: 'sites',   label: 'SITES',   href: '/sites' },
  { id: 'profile', label: 'PROFILE', href: '/profile' },
] as const

const MAIN_ROUTES = ['/dashboard', '/scans', '/sites', '/profile']
const HIDE_ROUTES = ['/profile/setup', '/profile/edit']

export default function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()

  if (!MAIN_ROUTES.includes(pathname) || HIDE_ROUTES.includes(pathname)) return null

  const activeId = pathname === '/dashboard' ? 'home'
    : pathname.startsWith('/scans')   ? 'scans'
    : pathname.startsWith('/sites')   ? 'sites'
    : pathname.startsWith('/profile') ? 'profile'
    : null

  if (!activeId) return null

  return (
    <nav style={{
      position: 'fixed', left: 0, right: 0, bottom: 0,
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
      alignItems: 'center',
      padding: '10px 10px 22px',
      background: 'var(--surf)',
      borderTop: '1.5px solid var(--line)',
      zIndex: 8,
    }}>
      {tabs.map(tab => {
        const isActive = activeId === tab.id
        return (
          <button key={tab.id} onClick={() => router.push(tab.href)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              fontFamily: 'var(--ff)', fontSize: 9.5, fontWeight: 500,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              position: 'relative', paddingTop: 9,
              background: 'none', border: 'none', cursor: 'pointer',
              color: isActive ? 'var(--amber)' : 'var(--mut)',
              transition: 'color 0.18s ease-out',
            }}>
            {isActive && (
              <span style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: 22, height: 3, borderRadius: 2, background: 'var(--amber)',
              }} />
            )}
            {NAV_ICONS[tab.id]}
            <span>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
