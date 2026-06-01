'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

// Hazard stripe: 7px diagonal black/amber bands — uses CSS var, no JS state needed
function HazardStripe() {
  return <div style={{ height: 7, background: 'var(--hazard-bg)', flexShrink: 0 }} />
}

interface AppHeaderProps {
  variant?: 'main' | 'detail' | 'modal'
  title?: string
  onBack?: () => void
  onClose?: () => void
  onLogoClick?: () => void
  rightAction?: 'menu' | 'share' | 'close' | 'none'
  rightContent?: React.ReactNode
}

export default function AppHeader({
  variant = 'main',
  title,
  onBack,
  onClose,
  onLogoClick,
  rightAction,
  rightContent,
}: AppHeaderProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isDark, setIsDark] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const effectiveRightAction = rightAction ?? (variant === 'main' ? 'menu' : variant === 'modal' ? 'close' : 'none')

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const dark = saved !== 'light'
    setIsDark(dark)
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    supabase.auth.getUser().then(({ data: { user } }) => setUserEmail(user?.email || null))
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute('data-theme') !== 'light')
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  const toggleTheme = () => {
    const newDark = !isDark
    setIsDark(newDark)
    const theme = newDark ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }

  const openMenu  = () => { setMenuOpen(true);  window.dispatchEvent(new CustomEvent('sidebar-open')) }
  const closeMenu = () => { setMenuOpen(false); window.dispatchEvent(new CustomEvent('sidebar-close')) }

  useEffect(() => {
    const onFabClose = () => setMenuOpen(false)
    window.addEventListener('sidebar-close', onFabClose)
    return () => window.removeEventListener('sidebar-close', onFabClose)
  }, [])

  const handleSignOut = async () => {
    closeMenu()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleLogoClick = () => {
    if (onLogoClick) onLogoClick()
    else router.push('/dashboard')
  }

  const handleBack = () => {
    if (onBack) onBack()
    else router.back()
  }

  // Icon button style (back, share, close, burger)
  const iconBtn: React.CSSProperties = {
    width: 38, height: 38, borderRadius: 8,
    display: 'grid', placeItems: 'center',
    border: '1.5px solid var(--line)',
    background: 'var(--surf)',
    color: 'var(--text)',
    flexShrink: 0,
  }

  return (
    <>
    <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)' }}>
      <HazardStripe />
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 18px 12px',
      }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          {variant === 'main' ? (
            <button onClick={handleLogoClick} style={{ background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: 11 }}>
              <div style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                {isDark
                  ? <img src="/brand/mark-amber.svg" alt="" style={{ width: 30, height: 30 }} />
                  : <img src="/brand/mark-duo-light.svg" alt="" style={{ width: 30, height: 30 }} />
                }
              </div>
              <span style={{ fontWeight: 600, fontSize: 20, letterSpacing: '-0.02em', color: 'var(--text)' }}>
                Safety<b style={{ color: 'var(--amber)' }}>Scan</b>
              </span>
            </button>
          ) : (
            <>
              <button onClick={handleBack} style={{ ...iconBtn, cursor: 'pointer' }}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M9.5 2L4 7.5 9.5 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {title && (
                <span style={{ fontWeight: 600, fontSize: 17, letterSpacing: '-0.01em', color: 'var(--text)' }}>{title}</span>
              )}
            </>
          )}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {rightContent}
          {effectiveRightAction === 'menu' && (
            <button onClick={openMenu} style={{ ...iconBtn, cursor: 'pointer' }} aria-label="Menu">
              <div style={{ display: 'grid', gap: 4 }}>
                <i style={{ display: 'block', width: 16, height: 2, background: 'var(--text)', borderRadius: 1 }} />
                <i style={{ display: 'block', width: 16, height: 2, background: 'var(--text)', borderRadius: 1 }} />
                <i style={{ display: 'block', width: 16, height: 2, background: 'var(--text)', borderRadius: 1 }} />
              </div>
            </button>
          )}
          {effectiveRightAction === 'share' && (
            <button style={{ ...iconBtn, cursor: 'pointer' }}>
              <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
                <circle cx="4.5" cy="9" r="1.7" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="13.5" cy="4.5" r="1.7" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="13.5" cy="13.5" r="1.7" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M6 8L12 5M6 10L12 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
          {effectiveRightAction === 'close' && (
            <button onClick={onClose || handleBack} style={{ ...iconBtn, cursor: 'pointer' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      </header>
    </div>

      {/* Drawer */}
      {menuOpen && (
        <>
          <div onClick={closeMenu} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40, animation: 'fadeIn 0.2s ease forwards' }}/>
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 280, background: isDark ? '#221F19' : '#FAF8F2', zIndex: 50, display: 'flex', flexDirection: 'column', padding: 24, borderLeft: '1.5px solid var(--line)', animation: 'slideInFromRight 0.28s cubic-bezier(0.2,0.7,0.3,1) forwards', willChange: 'transform' }}>
            <button onClick={closeMenu} style={{ alignSelf: 'flex-end', background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 22, cursor: 'pointer', marginBottom: 24, lineHeight: 1 }}>✕</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 28 }}>
              <img src={isDark ? '/brand/mark-amber.svg' : '/brand/mark-duo-light.svg'} alt="" style={{ width: 28, height: 28 }}/>
              <span style={{ fontWeight: 600, fontSize: 20, letterSpacing: '-0.02em', color: 'var(--text)' }}>
                Safety<b style={{ color: 'var(--amber)' }}>Scan</b>
              </span>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 'auto' }}>
              {[{ label: 'Home', href: '/dashboard' }, { label: 'Scans', href: '/scans' }, { label: 'Sites', href: '/sites' }, { label: 'Profile', href: '/profile' }, { label: 'Guide', href: '/guide' }].map(item => (
                <button key={item.href} onClick={() => { router.push(item.href); closeMenu() }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 16, fontWeight: 500, cursor: 'pointer', textAlign: 'left', padding: '13px 0', borderBottom: '1.5px solid var(--div)', fontFamily: 'inherit' }}>
                  {item.label}
                </button>
              ))}
            </nav>
            <div style={{ borderTop: '1.5px solid var(--div)', paddingTop: 16, marginTop: 16 }}>
              {/* Theme toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Dark mode</span>
                <button onClick={toggleTheme} style={{ width: 44, height: 24, borderRadius: 999, background: isDark ? 'var(--amber)' : 'var(--div)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <span style={{ position: 'absolute', top: 2, left: isDark ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }}/>
                </button>
              </div>
              {userEmail && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--amber)', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 600, color: '#1B1A12', flexShrink: 0 }}>
                    {userEmail[0].toUpperCase()}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--mut)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</div>
                </div>
              )}
              <button onClick={handleSignOut}
                style={{ width: '100%', padding: '10px', background: 'transparent', border: '1.5px solid var(--line)', borderRadius: 8, color: 'var(--text)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                Sign out
              </button>
            </div>
            <div style={{ fontSize: 10, color: 'var(--mut)', textAlign: 'center', marginTop: 16, fontFamily: 'var(--ff-mono)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>SafetyScan · Queensland</div>
          </div>
        </>
      )}
    </>
  )
}
