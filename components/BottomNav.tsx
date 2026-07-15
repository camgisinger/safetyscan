'use client'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { House, Layers, Camera, Folder, Menu, X, Wrench, Settings, LifeBuoy, ChevronRight } from 'lucide-react'

type TabId = 'home' | 'scans' | 'sites' | 'more'

const TABS: { id: TabId; label: string; Icon: any }[] = [
  { id: 'home',  label: 'Home',  Icon: House },
  { id: 'scans', label: 'Scans', Icon: Layers },
  { id: 'sites', label: 'Sites', Icon: Folder },
  { id: 'more',  label: 'More',  Icon: Menu },
]

const NAV_ROOTS = ['/dashboard', '/scans', '/sites', '/more', '/issues', '/profile', '/tools', '/settings']
const FAB_ROOTS = ['/dashboard', '/scans', '/sites', '/issues', '/settings']

function matches(path: string, roots: string[]) {
  return roots.some(r => path === r || path.startsWith(r + '/'))
}

function activeTab(pathname: string): TabId | null {
  if (pathname === '/dashboard') return 'home'
  if (pathname.startsWith('/scans')) return 'scans'
  if (pathname.startsWith('/sites')) return 'sites'
  if (pathname.startsWith('/more') || pathname.startsWith('/issues') || pathname.startsWith('/profile') || pathname.startsWith('/tools') || pathname.startsWith('/settings')) return 'more'
  return null
}

const MENU_ITEMS = [
  {
    icon: <Wrench size={20} strokeWidth={1.75} />,
    label: 'Tools',
    sub: 'Compliance tools & resources',
    badge: 'Coming soon' as string | null,
    href: '/tools',
  },
  {
    icon: <Settings size={20} strokeWidth={1.75} />,
    label: 'Settings',
    sub: 'Your account & preferences',
    badge: null,
    href: '/settings',
  },
  {
    icon: <LifeBuoy size={20} strokeWidth={1.75} />,
    label: 'Support',
    sub: 'Get help or send feedback',
    badge: null,
    href: '/support',
  },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router   = useRouter()
  const [showMore, setShowMore] = useState(false)

  if (!matches(pathname, NAV_ROOTS)) return null

  const active  = showMore ? 'more' : activeTab(pathname)
  const showFab = matches(pathname, FAB_ROOTS)

  const handleTab = (id: TabId) => {
    if (id === 'more') { setShowMore(v => !v); return }
    setShowMore(false)
    const hrefs: Record<TabId, string> = { home: '/dashboard', scans: '/scans', sites: '/sites', more: '' }
    router.push(hrefs[id])
  }

  return (
    <>
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
        {TABS.slice(0, 2).map(({ id, label, Icon }) => {
          const on = active === id
          return (
            <button key={id} onClick={() => handleTab(id)}
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

        {/* Centre FAB */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', overflow: 'visible' }}>
          {showFab && (
            <button
              onClick={() => { setShowMore(false); router.push('/scan/new') }}
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

        {TABS.slice(2).map(({ id, label, Icon }) => {
          const on = active === id
          return (
            <button key={id} onClick={() => handleTab(id)}
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

      {/* More sheet */}
      {showMore && (
        <>
          <div
            onClick={() => setShowMore(false)}
            style={{ position: 'fixed', inset: 0, background: 'var(--scrim)', zIndex: 100 }}
          />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 110,
            background: 'var(--surf-sheet)',
            borderRadius: 'var(--r-sheet) var(--r-sheet) 0 0',
            boxShadow: 'var(--shadow-sheet)',
            paddingBottom: 'max(32px, env(safe-area-inset-bottom, 32px))',
            animation: 'slideUpIn 0.28s cubic-bezier(0.2,0.7,0.3,1) forwards',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 4px' }}>
              <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}>Menu</span>
              <button onClick={() => setShowMore(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            {MENU_ITEMS.map((item, i) => (
              <button key={item.label} onClick={() => { setShowMore(false); router.push(item.href) }} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 20px',
                background: 'none', border: 'none',
                borderTop: i === 0 ? '1.5px solid var(--border-card)' : '1.5px solid var(--border-subtle)',
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: 'var(--surf-inset)', border: '1.5px solid var(--border-card)',
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                  color: 'var(--text-secondary)',
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>{item.label}</span>
                    {item.badge && (
                      <span style={{
                        fontSize: 9.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                        padding: '2px 7px', borderRadius: 4,
                        background: 'var(--warn-tint)', color: 'var(--warning)',
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-muted)', marginTop: 2 }}>{item.sub}</div>
                </div>
                <ChevronRight size={16} strokeWidth={1.75} color="var(--text-muted)" />
              </button>
            ))}
          </div>
        </>
      )}
    </>
  )
}
