'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

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

  const openMenu  = () => { setMenuOpen(true);  window.dispatchEvent(new CustomEvent('sidebar-open'))  }
  const closeMenu = () => { setMenuOpen(false); window.dispatchEvent(new CustomEvent('sidebar-close')) }

  useEffect(() => {
    const onFabClose = () => setMenuOpen(false)
    window.addEventListener('sidebar-close', onFabClose)
    return () => window.removeEventListener('sidebar-close', onFabClose)
  }, [])
  const [isDark, setIsDark] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const effectiveRightAction = rightAction ?? (variant === 'main' ? 'menu' : variant === 'modal' ? 'close' : 'none')

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const dark = saved !== 'light'
    setIsDark(dark)
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    supabase.auth.getUser().then(({ data: { user } }) => setUserEmail(user?.email || null))
  }, [])

  const toggleTheme = () => {
    const newDark = !isDark
    setIsDark(newDark)
    const theme = newDark ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }

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

  const markSrc = isDark ? '/brand/mark-amber.svg' : '/brand/mark-ink.svg'

  return (
    <header style={{ background: 'var(--bg)', padding: '8px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {variant === 'main' ? (
          <button onClick={handleLogoClick} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--card)', boxShadow: '0 0 0 1px var(--border)', display: 'grid', placeItems: 'center' }}>
              <img src={markSrc} alt="" style={{ width: 22, height: 22 }} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 19, letterSpacing: '-0.01em', color: 'var(--text)', fontFamily: 'var(--ff-sans)' }}>
              Safety<span style={{ color: 'var(--amber)' }}>Scan</span>
            </div>
          </button>
        ) : (
          <>
            <button onClick={handleBack} style={{ width: 36, height: 36, background: 'var(--card)', boxShadow: '0 0 0 1px var(--border)', borderRadius: 10, display: 'grid', placeItems: 'center', cursor: 'pointer', border: 'none', color: 'var(--text)' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {title && <span style={{ fontWeight: 600, fontSize: 16, letterSpacing: '-0.01em', color: 'var(--text)', fontFamily: 'var(--ff-sans)' }}>{title}</span>}
          </>
        )}
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {rightContent}
        {effectiveRightAction === 'menu' && (
          <button onClick={openMenu} style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', borderRadius: 10 }} aria-label="Open menu">
            <svg width="16" height="13" viewBox="0 0 16 13" fill="currentColor">
              <rect y="0"   width="16" height="1.6" rx="0.8"/>
              <rect y="5.7" width="16" height="1.6" rx="0.8"/>
              <rect y="11.4" width="16" height="1.6" rx="0.8"/>
            </svg>
          </button>
        )}
        {effectiveRightAction === 'share' && (
          <button style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="4.5" cy="9" r="1.6" stroke="currentColor" strokeWidth="1.4"/>
              <circle cx="13.5" cy="4.5" r="1.6" stroke="currentColor" strokeWidth="1.4"/>
              <circle cx="13.5" cy="13.5" r="1.6" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M6 8L12 5M6 10L12 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </button>
        )}
        {effectiveRightAction === 'close' && (
          <button onClick={onClose || handleBack} style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Drawer */}
      {menuOpen && (
        <>
          <div onClick={closeMenu} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40, animation: 'fadeIn 0.2s ease forwards' }}/>
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 280, background: '#16181C', zIndex: 50, display: 'flex', flexDirection: 'column', padding: 24, boxShadow: '-4px 0 24px rgba(0,0,0,0.4)', animation: 'slideInFromRight 0.28s cubic-bezier(0.2,0.7,0.3,1) forwards', willChange: 'transform' }}>
            <button onClick={closeMenu} style={{ alignSelf: 'flex-end', background: 'transparent', border: 'none', color: '#ECE7DD', fontSize: 22, cursor: 'pointer', marginBottom: 24, lineHeight: 1 }}>✕</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
              <img src="/brand/mark-amber.svg" alt="" style={{ width: 28, height: 28 }}/>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>
                <span style={{ color: '#ECE7DD' }}>Safety</span><span style={{ color: '#F39410' }}>Scan</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '0.5px solid rgba(255,255,255,0.08)', marginBottom: 8 }}>
              <span style={{ fontSize: 14, color: '#ECE7DD' }}>Dark mode</span>
              <button onClick={toggleTheme} style={{ width: 44, height: 24, borderRadius: 12, background: isDark ? '#F39410' : 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                <span style={{ position: 'absolute', top: 2, left: isDark ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }}/>
              </button>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 'auto' }}>
              {[{ label: 'Home', href: '/dashboard' }, { label: 'Scans', href: '/scans' }, { label: 'Sites', href: '/sites' }, { label: 'Profile', href: '/profile' }, { label: 'Guide', href: '/guide' }].map(item => (
                <button key={item.href} onClick={() => { router.push(item.href); closeMenu() }}
                  style={{ background: 'transparent', border: 'none', color: '#ECE7DD', fontSize: 16, fontWeight: 500, cursor: 'pointer', textAlign: 'left', padding: '12px 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)', fontFamily: 'inherit' }}>
                  {item.label}
                </button>
              ))}
            </nav>
            <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)', paddingTop: 16, marginTop: 16 }}>
              {userEmail && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F39410', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#16181C', flexShrink: 0 }}>
                    {userEmail[0].toUpperCase()}
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(236,231,221,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</div>
                </div>
              )}
              <button onClick={handleSignOut} style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#ECE7DD', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Sign out</button>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 16, fontFamily: 'var(--ff-mono)' }}>SafetyScan v0.1 · Queensland</div>
          </div>
        </>
      )}
    </header>
  )
}
