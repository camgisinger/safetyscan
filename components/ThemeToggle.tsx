'use client'
import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const current = (document.documentElement.dataset.theme ?? 'light') as 'light' | 'dark'
    setTheme(current)
  }, [])

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.dataset.theme = next
    try { localStorage.setItem('ss-theme', next) } catch {}
  }

  const dim = compact ? 34 : 38
  return (
    <button
      onClick={toggle}
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      style={{
        width: dim, height: dim,
        borderRadius: 'var(--r-control-sm)',
        display: 'grid', placeItems: 'center',
        border: '1.5px solid var(--border-card)',
        background: 'var(--surf)',
        color: 'var(--text)',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      {theme === 'light'
        ? <Moon size={15} strokeWidth={1.75} />
        : <Sun  size={15} strokeWidth={1.75} />}
    </button>
  )
}
