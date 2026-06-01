'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import AppHeader from '../../components/AppHeader'

export default function ProfilePage() {
  const [user, setUser]     = useState<any>(null)
  const [scans, setScans]   = useState<any[]>([])
  const [sites, setSites]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDark, setIsDark]   = useState(true)
  const router = useRouter()

  useEffect(() => {
    setIsDark(localStorage.getItem('theme') !== 'light')
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute('data-theme') !== 'light')
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

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
    return () => observer.disconnect()
  }, [router])

  const toggleTheme = () => {
    const newDark = !isDark; setIsDark(newDark)
    const t = newDark ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', t)
    localStorage.setItem('theme', t)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut(); router.push('/login')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 32, height: 32, border: '2px solid var(--line)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
    </div>
  )

  const meta        = user?.user_metadata || {}
  const fullName    = meta.full_name || ''
  const jobTitle    = meta.job_title  || ''
  const company     = meta.company    || ''
  const license     = meta.license    || ''
  const email       = user?.email     || ''
  const initials    = fullName ? fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : email[0]?.toUpperCase() || '?'
  const displayName = fullName || email
  const hasProfile  = !!fullName

  const monthIssues = scans.filter(s => s.status === 'fail').length

  const divStyle: React.CSSProperties    = { borderTop: '1.5px solid var(--div)' }
  const rowStyle: React.CSSProperties    = { display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px' }
  const iconChip: React.CSSProperties   = { width: 32, height: 32, borderRadius: 8, background: 'var(--bg)', border: '1.5px solid var(--line)', display: 'grid', placeItems: 'center', color: 'var(--mut)', flexShrink: 0 }

  return (
    <div className="page-fade-in" style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 96 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <AppHeader />
      <div style={{ padding: '0 18px' }}>

        {/* Complete profile prompt */}
        {!hasProfile && (
          <div onClick={() => router.push('/profile/setup')}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(238,128,26,0.08)', border: '1.5px solid var(--amber)', borderRadius: 4, marginBottom: 14, cursor: 'pointer' }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>👤</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--amber)', marginBottom: 2 }}>Complete your profile</div>
              <div style={{ fontWeight: 500, fontSize: 12, color: 'var(--mut)' }}>Add your name and role to personalise SafetyScan</div>
            </div>
            <span style={{ color: 'var(--amber)', fontSize: 16 }}>›</span>
          </div>
        )}

        {/* Profile card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 18, background: 'var(--surf)', border: '1.5px solid var(--line)', borderRadius: 4, marginBottom: 4 }}>
          <div style={{ width: 54, height: 54, borderRadius: 10, background: 'var(--amber)', display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 600, color: '#1B1A12', flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
            {jobTitle && (
              <div style={{ fontWeight: 600, fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--mut)', marginTop: 3 }}>{jobTitle}{license ? ` · QBCC ${license}` : ''}</div>
            )}
            {company && (
              <div style={{ fontWeight: 500, fontSize: 12, color: 'var(--mut)', marginTop: 2 }}>{company}</div>
            )}
            {!jobTitle && !company && (
              <div style={{ fontWeight: 500, fontSize: 12, color: 'var(--mut)', marginTop: 2 }}>{email}</div>
            )}
          </div>
          <button onClick={() => router.push('/profile/edit')}
            style={{ height: 34, padding: '0 14px', background: 'var(--bg)', border: '1.5px solid var(--line)', borderRadius: 6, fontSize: 12, fontWeight: 600, color: 'var(--mut)', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
            Edit
          </button>
        </div>

        {/* This month */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '22px 2px 11px' }}>
          <span style={{ width: 13, height: 3, borderRadius: 2, background: 'var(--amber)', flexShrink: 0 }}/>
          <span style={{ fontWeight: 600, fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--mut)' }}>This month</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: 'var(--surf)', border: '1.5px solid var(--line)', borderRadius: 4, overflow: 'hidden', marginBottom: 4 }}>
          {[
            { n: scans.length, l: 'Scans',  amber: false },
            { n: sites.length, l: 'Sites',  amber: false },
            { n: monthIssues,  l: 'Issues', amber: true  },
          ].map((s, i) => (
            <div key={i} style={{ padding: '12px 14px', borderRight: i < 2 ? '1.5px solid var(--div)' : 'none' }}>
              <div style={{ fontWeight: 700, fontSize: 28, lineHeight: 1, letterSpacing: '-0.02em', color: s.amber ? 'var(--amber)' : 'var(--text)' }}>{s.n}</div>
              <div style={{ fontWeight: 600, fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mut)', marginTop: 6 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Settings */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '22px 2px 11px' }}>
          <span style={{ width: 13, height: 3, borderRadius: 2, background: 'var(--amber)', flexShrink: 0 }}/>
          <span style={{ fontWeight: 600, fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--mut)' }}>Settings</span>
        </div>
        <div style={{ background: 'var(--surf)', border: '1.5px solid var(--line)', borderRadius: 4, overflow: 'hidden' }}>
          {/* Appearance */}
          <button onClick={toggleTheme} style={{ ...rowStyle, width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
            <div style={iconChip}><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.2" stroke="currentColor" strokeWidth="1.4"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/></svg></div>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Appearance</div>
            <span style={{ fontWeight: 600, fontSize: 10.5, letterSpacing: '0.08em', color: 'var(--mut)' }}>{isDark ? 'DARK' : 'LIGHT'} ›</span>
          </button>
          {/* Privacy */}
          <button style={{ ...rowStyle, ...divStyle, width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
            <div style={iconChip}><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5l5.5 2v4.2C13.5 11 11 13.5 8 14.5 5 13.5 2.5 11 2.5 7.7V3.5L8 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg></div>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Privacy & data</div>
            <span style={{ opacity: 0.4 }}>›</span>
          </button>
          {/* Help */}
          <button style={{ ...rowStyle, ...divStyle, width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
            <div style={iconChip}><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="M6.5 6.5a1.5 1.5 0 1 1 2.5 1.2c-.6.4-1 .7-1 1.3M8 11v.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg></div>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Help & support</div>
            <span style={{ opacity: 0.4 }}>›</span>
          </button>
          {/* Log out */}
          <button onClick={handleSignOut} style={{ ...rowStyle, ...divStyle, width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
            <div style={{ ...iconChip, background: 'var(--issue-bg)', color: 'var(--issue-tx-theme)', border: '1.5px solid var(--issue)' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M9 3H4v10h5M11 5l3 3-3 3M14 8H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--issue-tx-theme)' }}>Log out</div>
          </button>
        </div>

        {/* App version */}
        <div style={{ fontWeight: 600, fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--mut)', textAlign: 'center', marginTop: 24, opacity: 0.5 }}>
          SafetyScan v0.1 · Queensland
        </div>
      </div>
    </div>
  )
}
