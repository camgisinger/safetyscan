'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Site, Scan } from '../../lib/supabase'
import AppHeader from '../../components/AppHeader'

function Thumb({ url }: { url?: string | null }) {
  if (url) return <img src={url} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}/>
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 10, flexShrink: 0,
      backgroundColor: 'var(--thumb)',
      backgroundImage: 'repeating-linear-gradient(135deg, var(--thumb-2) 0 1px, transparent 1px 8px)',
      backgroundSize: '8px 8px',
    }}/>
  )
}

function Badge({ status, count }: { status: string; count?: number }) {
  const cfg: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    pass:      { bg: 'var(--status-green-bg)', color: 'var(--status-green)', dot: 'var(--status-green)', label: 'Clear' },
    fail:      { bg: 'var(--status-red-bg)',   color: 'var(--status-red)',   dot: 'var(--status-red)',   label: count ? `${count} issue${count !== 1 ? 's' : ''}` : 'Issues' },
    uncertain: { bg: 'var(--status-amber-bg)', color: 'var(--amber)',        dot: 'var(--amber)',        label: 'Pending' },
  }
  const c = cfg[status] || cfg.uncertain
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500, padding: '4px 10px 4px 8px', borderRadius: 999, background: c.bg, color: c.color, flexShrink: 0 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0 }}/>
      {c.label}
    </div>
  )
}

function formatMeta(createdAt: string, siteName?: string) {
  const d = new Date(createdAt)
  const day = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }).toUpperCase()
  const time = d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase().replace(' ', '')
  return siteName ? `${siteName.toUpperCase()} · ${day} · ${time}` : `${day} · ${time}`
}

export default function DashboardPage() {
  const [scans, setScans] = useState<Scan[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [isDark, setIsDark] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    setIsDark(saved !== 'light')
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute('data-theme') !== 'light')
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const [scansRes, sitesRes] = await Promise.all([
        supabase.from('scans').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('sites').select('*').order('name', { ascending: true }),
      ])
      setScans(scansRes.data || [])
      setSites(sitesRes.data || [])
      setLoading(false)
    }
    init()
  }, [router])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2.5px solid var(--border)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  // This-month stats
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const thisMonth = scans.filter(s => new Date(s.created_at) >= monthStart)
  const monthIssues = thisMonth.filter(s => s.status === 'fail').length
  const activeSites = sites.filter(s => !s.archived).length
  const recentActivity = scans.slice(0, 10)

  return (
    <div className="page-fade-in" style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--ff-sans)', willChange: 'opacity' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <AppHeader />
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '0 18px 96px' }}>

        {/* Stats card */}
        <div style={{ background: 'var(--card)', borderRadius: 16, padding: 16, boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-mut)' }}>This month</span>
            <button onClick={() => router.push('/scans')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--amber)', fontSize: 12.5, fontWeight: 500, fontFamily: 'var(--ff-sans)', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>View all <span>→</span></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, paddingTop: 14 }}>
            {[
              { num: thisMonth.length, label: 'Scans', amber: false },
              { num: activeSites,      label: 'Sites', amber: false },
              { num: monthIssues,      label: 'Issues', amber: true },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: 32, fontWeight: 600, lineHeight: 1, letterSpacing: '-0.02em', color: s.amber ? 'var(--amber)' : 'var(--text)' }}>{s.num}</div>
                <div style={{ marginTop: 6, fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-mut)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Guide banner */}
        <div onClick={() => router.push('/guide')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 16, background: 'var(--card)', boxShadow: 'var(--shadow-card)', marginTop: 12, cursor: 'pointer' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--card-2)', boxShadow: '0 0 0 1px var(--border)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <img src={isDark ? '/brand/mark-amber.svg' : '/brand/mark-ink.svg'} alt="" style={{ width: 22, height: 22 }}/>
          </div>
          <div style={{ flex: 1, fontWeight: 600, fontSize: 14.5, color: 'var(--text)' }}>SafetyScan Guide</div>
          <span style={{ opacity: 0.5, fontSize: 16 }}>→</span>
        </div>

        {/* Recent activity */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 4px 10px' }}>
          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--text-mut)' }}>Recent activity</span>
          <button onClick={() => router.push('/scans')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--amber)', fontSize: 12.5, fontWeight: 500, fontFamily: 'var(--ff-sans)', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>View all <span>→</span></button>
        </div>

        {recentActivity.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-mut)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📷</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>No scans yet</div>
            <div style={{ fontSize: 13 }}>Tap + to run your first compliance scan</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentActivity.map(scan => {
              const photoUrl = scan.photo_urls?.[0] || scan.photo_url
              const siteName = sites.find(s => s.id === scan.site_id)?.name
              const issueCount = (scan.findings || []).filter((f: any) => f.type === 'critical').length
              return (
                <div key={scan.id} onClick={() => router.push(`/scan/${scan.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16, background: 'var(--card)', boxShadow: 'var(--shadow-card)', cursor: 'pointer' }}>
                  <Thumb url={photoUrl}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{scan.work_type || 'Unnamed scan'}</div>
                    <div style={{ marginTop: 2, fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '0.06em', color: 'var(--text-mut)', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {formatMeta(scan.created_at, siteName)}
                    </div>
                  </div>
                  <Badge status={scan.status} count={issueCount || undefined}/>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
