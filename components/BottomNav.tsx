'use client'
import { usePathname, useRouter } from 'next/navigation'
import { House, Layers, Camera, Folder, Menu } from 'lucide-react'

type TabId = 'home' | 'scans' | 'sites' | 'more'

const TABS: { id: TabId; label: string; href: string; Icon: any }[] = [
  { id: 'home',  label: 'Home',  href: '/dashboard', Icon: House },
  { id: 'scans', label: 'Scans', href: '/scans',     Icon: Layers },
  { id: 'sites', label: 'Sites', href: '/sites',     Icon: Folder },
  { id: 'more',  label: 'More',  href: '/more',      Icon: Menu },
]

// Show nav on these paths (prefix match)
const NAV_ROOTS = ['/dashboard', '/scans', '/sites', '/more', '/issues']
// Show FAB on these (subset of NAV_ROOTS)
const FAB_ROOTS = ['/dashboard', '/scans', '/sites', '/more', '/issues']

function matches(path: string, roots: string[]) {
  return roots.some(r => path === r || path.startsWith(r + '/'))
}

function activeTab(pathname: string): TabId | null {
  if (pathname === '/dashboard') return 'home'
  if (pathname.startsWith('/scans')) return 'scans'
  if (pathname.startsWith('/sites')) return 'sites'
  if (pathname.startsWith('/more') || pathname.startsWith('/issues')) return 'more'
  return null
}

export default function BottomNav() {
  const pathname = usePathname()
  const router   = useRouter()

  if (!matches(pathname, NAV_ROOTS)) return null

  const active  = activeTab(pathname)
  const showFab = matches(pathname, FAB_ROOTS)

  return (
    <nav
      className="bottom-nav"
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        alignItems: 'flex-end',
        background: 'var(--surf)',
        borderTop: '1.5px solid var(--div)',
        padding: '8px 16px',
        paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
        zIndex: 50,
        overflow: 'visible',
      }}
    >
      {/* Left: Home, Scans */}
      {TABS.slice(0, 2).map(({ id, label, href, Icon }) => {
        const on = active === id
        return (
          <button key={id} onClick={() => router.push(href)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              color: on ? 'var(--amber)' : 'var(--text-placeholder)',
              fontFamily: 'var(--ff)',
              WebkitTapHighlightColor: 'transparent',
            }}>
            <Icon size={23} strokeWidth={on ? 2.2 : 1.75} />
            <span style={{ fontSize: 10.5, fontWeight: on ? 600 : 500, lineHeight: 1 }}>{label}</span>
          </button>
        )
      })}

      {/* Centre: FAB */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', overflow: 'visible' }}>
        {showFab && (
          <button
            onClick={() => router.push('/scan/new')}
            aria-label="New scan"
            style={{
              width: 58, height: 58, borderRadius: '50%',
              background: 'var(--amber)', border: 'none', cursor: 'pointer',
              display: 'grid', placeItems: 'center',
              color: '#fff', flexShrink: 0,
              marginTop: '-30px', marginBottom: 6,
              boxShadow: '0 0 0 4px var(--fab-ring), var(--shadow-fab)',
              WebkitTapHighlightColor: 'transparent',
            }}>
            <Camera size={26} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Right: Sites, More */}
      {TABS.slice(2).map(({ id, label, href, Icon }) => {
        const on = active === id
        return (
          <button key={id} onClick={() => router.push(href)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              color: on ? 'var(--amber)' : 'var(--text-placeholder)',
              fontFamily: 'var(--ff)',
              WebkitTapHighlightColor: 'transparent',
            }}>
            <Icon size={23} strokeWidth={on ? 2.2 : 1.75} />
            <span style={{ fontSize: 10.5, fontWeight: on ? 600 : 500, lineHeight: 1 }}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
