'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Site, Scan } from '../../lib/supabase'
import AppHeader from '../../components/AppHeader'

// Shared helpers
function statusBar(status: string) {
  return status === 'pass' ? '#3E8E5A' : status === 'fail' ? '#D63A26' : 'var(--amber)'
}
function statusLabel(status: string, count?: number) {
  if (status === 'pass') return 'Clear'
  if (status === 'fail') return count ? `${count} issue${count !== 1 ? 's' : ''}` : 'Issues'
  return 'Pending'
}
function statusColor(status: string) {
  if (status === 'pass') return 'var(--clear-tx)'
  if (status === 'fail') return 'var(--issue-tx-theme)'
  return 'var(--amber)'
}

function Thumb({ url }: { url?: string | null }) {
  const bg = url ? undefined : {
    backgroundColor: 'var(--surf)',
    backgroundImage: 'repeating-linear-gradient(135deg, var(--div) 0 1.5px, transparent 1.5px 8px)',
    backgroundSize: '8px 8px',
  }
  if (url) return (
    <img src={url} alt="" style={{ width: 46, alignSelf: 'stretch', objectFit: 'cover', display: 'block', borderRight: '1.5px solid var(--line)', flexShrink: 0 }}/>
  )
  return <div style={{ width: 46, alignSelf: 'stretch', borderRight: '1.5px solid var(--line)', flexShrink: 0, ...bg }} />
}

function ActivityTicket({ scan, siteName, onClick }: { scan: Scan; siteName?: string; onClick: () => void }) {
  const photoUrl = scan.photo_urls?.[0] || scan.photo_url
  const issueCount = (scan.findings || []).filter((f: any) => f.type === 'critical').length
  const d = new Date(scan.created_at)
  const meta = [siteName?.toUpperCase(), d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }).toUpperCase(), d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase().replace(' ', '')].filter(Boolean).join(' · ')
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'stretch', background: 'var(--surf)', border: '1.5px solid var(--line)', borderRadius: 4, overflow: 'hidden', cursor: 'pointer', marginBottom: 8 }}>
      <div style={{ width: 5, flexShrink: 0, background: statusBar(scan.status) }} />
      <Thumb url={photoUrl} />
      <div style={{ flex: 1, padding: '11px 13px', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.1, letterSpacing: '-0.02em', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{scan.work_type || 'Unnamed scan'}</div>
        <div style={{ fontWeight: 600, fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mut)', marginTop: 4 }}>{meta}</div>
      </div>
      <div style={{ alignSelf: 'center', paddingRight: 13, textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 12.5, letterSpacing: '-0.005em', color: statusColor(scan.status) }}>
          {statusLabel(scan.status, issueCount || undefined)}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [scans, setScans] = useState<Scan[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

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
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 32, height: 32, border: '2px solid var(--line)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
    </div>
  )

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const thisMonth  = scans.filter(s => new Date(s.created_at) >= monthStart)
  const monthIssues = thisMonth.filter(s => s.status === 'fail').length
  const activeSites = sites.filter(s => !s.archived).length
  const recent = scans.slice(0, 8)

  return (
    <div className="page-fade-in" style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 96 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <AppHeader />

      <div style={{ padding: '0 18px' }}>
        {/* Stats strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: 'var(--surf)', border: '1.5px solid var(--line)', borderRadius: 4, overflow: 'hidden' }}>
          {[
            { n: thisMonth.length, l: 'Scans', amber: false },
            { n: activeSites,      l: 'Sites', amber: false },
            { n: monthIssues,      l: 'Issues', amber: true },
          ].map((s, i) => (
            <div key={i} style={{ padding: '12px 14px', borderRight: i < 2 ? '1.5px solid var(--div)' : 'none' }}>
              <div style={{ fontWeight: 700, fontSize: 28, lineHeight: 1, letterSpacing: '-0.02em', color: s.amber ? 'var(--amber)' : 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{s.n}</div>
              <div style={{ fontWeight: 600, fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mut)', marginTop: 6 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Guide banner */}
        <div onClick={() => router.push('/guide')}
          style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 14px', background: 'var(--surf)', border: '1.5px solid var(--line)', borderRadius: 4, marginTop: 8, cursor: 'pointer' }}>
          <div style={{ width: 34, height: 34, borderRadius: 4, background: 'var(--amber)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <img src="/brand/mark-ink.svg" alt="" style={{ width: 24, height: 24 }}/>
          </div>
          <div style={{ flex: 1, fontWeight: 600, fontSize: 15.5, letterSpacing: '-0.02em', color: 'var(--text)' }}>SafetyScan Guide</div>
          <span style={{ color: 'var(--mut)', fontSize: 17 }}>›</span>
        </div>

        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '22px 2px 11px' }}>
          <span style={{ width: 13, height: 3, borderRadius: 2, background: 'var(--amber)', flexShrink: 0 }}/>
          <span style={{ fontWeight: 600, fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--mut)' }}>Recent activity</span>
          <button onClick={() => router.push('/scans')} style={{ marginLeft: 'auto', fontWeight: 500, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--amber)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>View all</button>
        </div>

        {recent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--mut)' }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>No scans yet — tap + to start</div>
          </div>
        ) : (
          <div>
            {recent.map(scan => (
              <ActivityTicket key={scan.id} scan={scan}
                siteName={sites.find(s => s.id === scan.site_id)?.name}
                onClick={() => router.push(`/scan/${scan.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
