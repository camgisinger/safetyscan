'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

const ShieldLogo = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g opacity="0.7">
      <path d="M14 14 H58 V25 H25 V58 H14 Z" fill="#EFEAE0"/>
      <path d="M226 14 H182 V25 H215 V58 H226 Z" fill="#EFEAE0"/>
      <path d="M14 226 H58 V215 H25 V182 H14 Z" fill="#EFEAE0"/>
      <path d="M226 226 H182 V215 H215 V182 H226 Z" fill="#EFEAE0"/>
    </g>
    <path d="M120 32 L190 56 V128 C190 170 162 196 120 214 C78 196 50 170 50 128 V56 Z" fill="none" stroke="#F39410" strokeWidth="8" strokeLinejoin="miter"/>
    <polyline points="88,120 110,142 154,96" fill="none" stroke="#F39410" strokeWidth="16" strokeLinecap="square" strokeLinejoin="miter"/>
  </svg>
)

interface AppHeaderProps {
  rightContent?: React.ReactNode
}

export default function AppHeader({ rightContent }: AppHeaderProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isDark, setIsDark] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const dark = saved !== 'light'
    setIsDark(dark)
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email || null)
    })
  }, [])

  const toggleTheme = () => {
    const newDark = !isDark
    setIsDark(newDark)
    const theme = newDark ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }

  const handleSignOut = async () => {
    setMenuOpen(false)
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header style={{ background: '#16181C', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
      <button onClick={() => router.push('/dashboard')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: 0 }}>
        <ShieldLogo />
        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.01em' }}>
          <span style={{ color: '#EFEAE0' }}>Safety</span><span style={{ color: '#F39410' }}>Scan</span>
        </div>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {rightContent && <div>{rightContent}</div>}
        <button
          onClick={() => setMenuOpen(true)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#EFEAE0', padding: 8, display: 'flex', flexDirection: 'column', gap: 5 }}
          aria-label="Open menu"
        >
          <span style={{ display: 'block', width: 22, height: 2, background: '#EFEAE0', borderRadius: 2 }} />
          <span style={{ display: 'block', width: 22, height: 2, background: '#EFEAE0', borderRadius: 2 }} />
          <span style={{ display: 'block', width: 22, height: 2, background: '#EFEAE0', borderRadius: 2 }} />
        </button>
      </div>

      {menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40, animation: 'fadeIn 0.2s ease forwards' }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 280, background: '#16181C', zIndex: 50, display: 'flex', flexDirection: 'column', padding: 24, boxShadow: '-4px 0 24px rgba(0,0,0,0.4)', animation: 'slideInFromRight 0.28s cubic-bezier(0.2, 0.7, 0.3, 1) forwards', willChange: 'transform' }}>

            <button onClick={() => setMenuOpen(false)} style={{ alignSelf: 'flex-end', background: 'transparent', border: 'none', color: '#EFEAE0', fontSize: 22, cursor: 'pointer', marginBottom: 24, lineHeight: 1 }}>✕</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
              <ShieldLogo size={28} />
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.01em' }}>
                <span style={{ color: '#EFEAE0' }}>Safety</span><span style={{ color: '#F39410' }}>Scan</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '0.5px solid rgba(255,255,255,0.08)', marginBottom: 8 }}>
              <span style={{ fontSize: 14, color: '#EFEAE0' }}>Dark mode</span>
              <button
                onClick={toggleTheme}
                style={{ width: 44, height: 24, borderRadius: 12, background: isDark ? '#F39410' : 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}
              >
                <span style={{ position: 'absolute', top: 2, left: isDark ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </button>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 'auto' }}>
              {[
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Sites', href: '/sites' },
                { label: 'New scan', href: '/' },
                { label: 'Guide', href: '/guide' },
              ].map(item => (
                <button
                  key={item.href}
                  onClick={() => { router.push(item.href); setMenuOpen(false) }}
                  style={{ background: 'transparent', border: 'none', color: '#EFEAE0', fontSize: 16, fontWeight: 500, cursor: 'pointer', textAlign: 'left', padding: '12px 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)', fontFamily: 'Inter, system-ui, sans-serif' }}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)', paddingTop: 16, marginTop: 16 }}>
              {userEmail && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F39410', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#16181C', flexShrink: 0 }}>
                    {userEmail[0].toUpperCase()}
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(239,234,224,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</div>
                </div>
              )}
              <button
                onClick={handleSignOut}
                style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#EFEAE0', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                Sign out
              </button>
            </div>

            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 16, fontFamily: 'JetBrains Mono, monospace' }}>SafetyScan v0.1 · Queensland</div>
          </div>
        </>
      )}
    </header>
  )
}
