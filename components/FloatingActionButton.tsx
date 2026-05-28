'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const HIDE_ON = ['/', '/login', '/profile', '/guide']
const DRAWER_WIDTH = 280

export default function FloatingActionButton() {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const open = () => setSidebarOpen(true)
    const close = () => setSidebarOpen(false)
    window.addEventListener('sidebar-open', open)
    window.addEventListener('sidebar-close', close)
    return () => {
      window.removeEventListener('sidebar-open', open)
      window.removeEventListener('sidebar-close', close)
    }
  }, [])

  if (
    HIDE_ON.includes(pathname) ||
    pathname.startsWith('/scan/') ||
    pathname.startsWith('/shared/')
  ) return null

  return (
    <button
      onClick={() => { if (!sidebarOpen) router.push('/') }}
      style={{
        position: 'fixed',
        right: 24,
        bottom: 92,
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: 'var(--fab-bg)',
        border: 'none',
        cursor: sidebarOpen ? 'default' : 'pointer',
        padding: 0,
        display: 'grid',
        placeItems: 'center',
        boxShadow: 'var(--fab-shadow)',
        zIndex: sidebarOpen ? 45 : 9,
        transform: sidebarOpen ? `translateX(-${DRAWER_WIDTH}px)` : 'translateX(0)',
        transition: 'transform 0.28s cubic-bezier(0.2, 0.7, 0.3, 1), box-shadow 0.2s ease',
        willChange: 'transform',
      }}
      onMouseEnter={e => { if (!sidebarOpen) e.currentTarget.style.transform = 'scale(1.06)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = sidebarOpen ? `translateX(-${DRAWER_WIDTH}px)` : 'scale(1)' }}
      aria-label="New scan"
    >
      <svg viewBox="0 0 22 22" fill="none" width="22" height="22">
        <path d="M11 3v16M3 11h16" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
    </button>
  )
}
