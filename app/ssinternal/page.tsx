'use client'
import { useState } from 'react'

interface UserRow {
  user_id: string
  email: string
  scan_count: number
}

interface UsageData {
  total_scans_this_month: number
  total_users: number
  scans_today: number
  average_scans_per_user: number
  users: UserRow[]
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [sessionSecret, setSessionSecret] = useState('')
  const [data, setData] = useState<UsageData | null>(null)
  const [authError, setAuthError] = useState('')
  const [fetchError, setFetchError] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchData = async (secret: string) => {
    setLoading(true)
    setAuthError('')
    setFetchError('')
    try {
      const res = await fetch('/api/admin/usage', {
        headers: { Authorization: `Bearer ${secret}` },
      })
      if (res.status === 401) {
        setAuthError('Incorrect password.')
        setData(null)
        return
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Server error ${res.status}`)
      }
      const json: UsageData = await res.json()
      setData(json)
      setSessionSecret(secret)
    } catch (e: any) {
      setFetchError(e.message || 'Failed to load data.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password.trim()) fetchData(password.trim())
  }

  const handleRefresh = () => {
    if (sessionSecret) fetchData(sessionSecret)
  }

  // ── Locked ────────────────────────────────────────────────────────────────
  if (!data) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--ff)',
      }}>
        <div style={{
          background: 'var(--surf)', border: '1.5px solid var(--line)',
          borderRadius: 8, padding: '32px 28px', width: '100%', maxWidth: 340,
        }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 20 }}>Safety</span>
              <span style={{ color: 'var(--amber)', fontWeight: 700, fontSize: 20 }}>Scan</span>
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--mut)' }}>Internal</div>
          </div>

          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              style={{
                display: 'block', width: '100%', padding: '11px 14px',
                background: 'var(--bg)', border: '1.5px solid var(--div)',
                borderRadius: 6, fontSize: 14, color: 'var(--text)',
                marginBottom: authError ? 8 : 12, boxSizing: 'border-box' as const,
              }}
            />
            {authError && (
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--issue-tx-theme)', marginBottom: 10 }}>
                {authError}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !password.trim()}
              style={{
                display: 'block', width: '100%', padding: '11px',
                background: 'var(--amber)', border: 'none', borderRadius: 6,
                fontSize: 14, fontWeight: 700, color: '#1B1A12',
                cursor: loading || !password.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !password.trim() ? 0.55 : 1,
              }}
            >
              {loading ? 'Checking…' : 'Access'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Unlocked ──────────────────────────────────────────────────────────────
  const card = (label: string, value: string | number) => (
    <div style={{
      background: 'var(--surf)', border: '1.5px solid var(--line)',
      borderRadius: 6, padding: '18px 20px',
    }}>
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '0.16em',
        textTransform: 'uppercase' as const, color: 'var(--mut)', marginBottom: 10,
      }}>
        {label}
      </div>
      <div style={{ fontSize: 34, fontWeight: 700, color: 'var(--amber)', letterSpacing: '-0.02em' }}>
        {value}
      </div>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--ff)',
      padding: '32px 24px 64px', maxWidth: 800, margin: '0 auto',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <div>
            <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 20 }}>Safety</span>
            <span style={{ color: 'var(--amber)', fontWeight: 700, fontSize: 20 }}>Scan</span>
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: 'var(--mut)' }}>
            Internal
          </span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          style={{
            padding: '8px 16px', background: 'var(--surf)', border: '1.5px solid var(--line)',
            borderRadius: 6, fontSize: 13, fontWeight: 600, color: 'var(--text)',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.55 : 1,
            display: 'flex', alignItems: 'center', gap: 7,
          }}
        >
          {loading && (
            <span style={{
              width: 12, height: 12, border: '2px solid var(--div)',
              borderTopColor: 'var(--amber)', borderRadius: '50%',
              animation: 'spin 0.7s linear infinite', display: 'inline-block',
            }} />
          )}
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
        {card('Total Scans This Month', data.total_scans_this_month)}
        {card('Total Users', data.total_users)}
        {card('Scans Today', data.scans_today)}
        {card('Avg Scans / User', data.average_scans_per_user)}
      </div>

      {/* User table */}
      <div style={{ background: 'var(--surf)', border: '1.5px solid var(--line)', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 140px',
          padding: '10px 16px', borderBottom: '1.5px solid var(--div)', background: 'var(--bg)',
        }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: 'var(--mut)' }}>Email</span>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: 'var(--mut)', textAlign: 'right' as const }}>Scans This Month</span>
        </div>

        {data.users.length === 0 ? (
          <div style={{ padding: '20px 16px', fontSize: 13, color: 'var(--mut)' }}>No scans this month.</div>
        ) : (
          data.users.map((u, i) => (
            <div
              key={u.user_id}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 140px',
                padding: '12px 16px', alignItems: 'center',
                borderBottom: i < data.users.length - 1 ? '1px solid var(--div)' : 'none',
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'var(--ff-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                {u.email}
              </span>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--amber)', textAlign: 'right' as const }}>
                {u.scan_count}
              </span>
            </div>
          ))
        )}
      </div>

      {fetchError && (
        <div style={{ marginTop: 14, fontSize: 13, color: 'var(--issue-tx-theme)' }}>{fetchError}</div>
      )}
    </div>
  )
}
