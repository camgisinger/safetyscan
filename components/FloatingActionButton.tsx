'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const HIDE_ON = ['/', '/login', '/profile', '/guide', '/scan/new']
const DRAWER_WIDTH = 280

export default function FloatingActionButton() {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const open  = () => setSidebarOpen(true)
    const close = () => setSidebarOpen(false)
    window.addEventListener('sidebar-open',  open)
    window.addEventListener('sidebar-close', close)
    return () => {
      window.removeEventListener('sidebar-open',  open)
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
      onClick={() => {
        if (sidebarOpen) window.dispatchEvent(new CustomEvent('sidebar-close'))
        router.push('/scan/new')
      }}
      style={{
        position: 'fixed',
        right: 22, bottom: 92,
        width: 58, height: 58,
        borderRadius: 18,
        background: 'var(--amber)',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        display: 'grid', placeItems: 'center',
        color: '#1B1A12',
        boxShadow: 'var(--shadow-fab)',
        zIndex: sidebarOpen ? 45 : 9,
        transform: sidebarOpen ? `translateX(-${DRAWER_WIDTH}px)` : 'translateX(0)',
        transition: 'transform 0.28s cubic-bezier(0.2,0.7,0.3,1)',
        willChange: 'transform',
      }}
      aria-label="New scan"
    >
      <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
        <path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
    </button>
  )
}
