'use client'
import { useRouter, usePathname } from 'next/navigation'

const HIDE_ON = ['/', '/login', '/profile', '/guide']

export default function FloatingActionButton() {
  const router = useRouter()
  const pathname = usePathname()

  if (
    HIDE_ON.includes(pathname) ||
    pathname.startsWith('/scan/') ||
    pathname.startsWith('/shared/')
  ) return null

  return (
    <button
      onClick={() => router.push('/')}
      style={{
        position: 'fixed',
        right: 24,
        bottom: 92,
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: 'var(--amber)',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        display: 'grid',
        placeItems: 'center',
        boxShadow: 'var(--shadow-fab)',
        zIndex: 9,
        transition: 'transform 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      aria-label="New scan"
    >
      <svg viewBox="0 0 22 22" fill="none" width="22" height="22">
        <path d="M11 3v16M3 11h16" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
    </button>
  )
}
