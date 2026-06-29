'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AccessPage() {
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        router.push('/')
      } else {
        setError('Incorrect password')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: '100%', maxWidth: 360 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, justifyContent: 'center', marginBottom: 40 }}>
          <img src="/brand/mark-amber.svg" alt="" style={{ width: 32, height: 32 }} />
          <span style={{ fontWeight: 600, fontSize: 22, letterSpacing: '-0.02em', color: 'var(--text)' }}>
            Safety<b style={{ color: 'var(--amber)' }}>Scan</b>
          </span>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--surf)', border: '1.5px solid var(--line)', borderRadius: 4, padding: '28px 24px' }}>
          <h1 style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text)', margin: '0 0 6px' }}>
            Site access
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--mut)', margin: '0 0 24px', lineHeight: 1.5 }}>
            This site is password protected while it&apos;s being built.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mut)', marginBottom: 7, fontFamily: 'var(--ff-mono)' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="Enter password"
                autoFocus
                required
                style={{
                  width: '100%', height: 44, padding: '0 13px',
                  background: 'var(--bg)', border: '1.5px solid var(--line)',
                  borderRadius: 4, fontSize: 15, color: 'var(--text)',
                  fontFamily: 'inherit', outline: 'none',
                  boxSizing: 'border-box',
                  borderColor: error ? 'var(--issue)' : undefined,
                }}
              />
              {error && (
                <p style={{ fontSize: 12.5, color: 'var(--issue-tx-theme)', marginTop: 7, marginBottom: 0 }}>{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              style={{
                width: '100%', height: 44,
                background: loading || !password ? 'var(--line)' : 'var(--amber)',
                border: 'none', borderRadius: 4,
                fontSize: 14, fontWeight: 600,
                color: loading || !password ? 'var(--mut)' : '#1B1A12',
                cursor: loading || !password ? 'default' : 'pointer',
                fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.15s',
              }}
            >
              {loading
                ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#1B1A12', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Checking…</>
                : 'Continue'
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
