'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import AppHeader from '../../components/AppHeader'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [scans, setScans] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDark, setIsDark] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    setIsDark(saved !== 'light')
    const init = async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/login'); return }
      setUser(u)
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const [scansRes, sitesRes] = await Promise.all([
        supabase.from('scans').select('id, status, created_at').gte('created_at', monthStart.toISOString()),
        supabase.from('sites').select('id').eq('archived', false),
      ])
      setScans(scansRes.data || [])
      setSites(sitesRes.data || [])
      setLoading(false)
    }
    init()
  }, [router])

  const toggleTheme = () => {
    const newDark = !isDark
    setIsDark(newDark)
    const theme = newDark ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2.5px solid var(--border)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const email = user?.email || ''
  const initials = email.slice(0, 2).toUpperCase()
  const monthIssues = scans.filter(s => s.status === 'fail').length

  const settingsRows = [
    {
      icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.2" stroke="currentColor" strokeWidth="1.4"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/></svg>,
      label: 'Appearance',
      right: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '0.08em', color: 'var(--text-mut)' }}>{isDark ? 'DARK' : 'LIGHT'}</span><span style={{ opacity: 0.4 }}>›</span></span>,
      onClick: toggleTheme,
      danger: false,
    },
    {
      icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5l5.5 2v4.2C13.5 11 11 13.5 8 14.5 5 13.5 2.5 11 2.5 7.7V3.5L8 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>,
      label: 'Privacy',
      right: <span style={{ opacity: 0.4 }}>›</span>,
      onClick: undefined,
      danger: false,
    },
    {
      icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="M6.5 6.5a1.5 1.5 0 1 1 2.5 1.2c-.6.4-1 .7-1 1.3M8 11v.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
      label: 'Help & support',
      right: <span style={{ opacity: 0.4 }}>›</span>,
      onClick: undefined,
      danger: false,
    },
    {
      icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M9 3H4v10h5M11 5l3 3-3 3M14 8H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      label: 'Log out',
      right: null,
      onClick: handleSignOut,
      danger: true,
    },
  ]

  return (
    <div className="page-fade-in" style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--ff-sans)', willChange: 'opacity' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <AppHeader />
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '0 18px 96px' }}>

        {/* Profile card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 18, borderRadius: 16, background: 'var(--card)', boxShadow: 'var(--shadow-card)', marginBottom: 4 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--amber)', display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.65, marginTop: 4, color: 'var(--text-mut)' }}>Site Supervisor</div>
          </div>
        </div>

        {/* This month */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 4px 10px' }}>
          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--text-mut)' }}>This month</span>
        </div>
        <div style={{ background: 'var(--card)', borderRadius: 16, padding: 16, boxShadow: 'var(--shadow-card)', marginBottom: 4 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { num: scans.length, label: 'Scans', amber: false },
              { num: sites.length, label: 'Sites', amber: false },
              { num: monthIssues, label: 'Issues', amber: true },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: 32, fontWeight: 600, lineHeight: 1, letterSpacing: '-0.02em', color: s.amber ? 'var(--amber)' : 'var(--text)' }}>{s.num}</div>
                <div style={{ marginTop: 6, fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-mut)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 4px 10px' }}>
          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--text-mut)' }}>Settings</span>
        </div>
        <div style={{ background: 'var(--card)', borderRadius: 16, padding: '4px 4px', boxShadow: 'var(--shadow-card)' }}>
          {settingsRows.map((row, i) => (
            <button key={i} onClick={row.onClick}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 12px', width: '100%', background: 'none', border: 'none', borderTop: i > 0 ? '1px solid var(--divider)' : 'none', cursor: row.onClick ? 'pointer' : 'default', fontFamily: 'var(--ff-sans)', textAlign: 'left' }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, display: 'grid', placeItems: 'center', background: row.danger ? 'var(--status-red-bg)' : 'var(--card-2)', color: row.danger ? 'var(--status-red)' : 'var(--text-mut)', flexShrink: 0 }}>
                {row.icon}
              </div>
              <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: row.danger ? 'var(--status-red)' : 'var(--text)' }}>{row.label}</div>
              {row.right}
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
