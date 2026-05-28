'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Scan } from '../../lib/supabase'
import AppHeader from '../../components/AppHeader'

type Filter = 'all' | 'issues' | 'clear' | 'pending'

function Thumb({ url }: { url?: string | null }) {
  if (url) return <img src={url} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}/>
  return (
    <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, backgroundColor: 'var(--thumb)', backgroundImage: 'repeating-linear-gradient(135deg, var(--thumb-2) 0 1px, transparent 1px 8px)', backgroundSize: '8px 8px' }}/>
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

export default function ScansPage() {
  const [scans, setScans] = useState<Scan[]>([])
  const [sites, setSites] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const [scansRes, sitesRes] = await Promise.all([
        supabase.from('scans').select('*').order('created_at', { ascending: false }),
        supabase.from('sites').select('id, name'),
      ])
      setScans(scansRes.data || [])
      setSites((sitesRes.data || []) as { id: string; name: string }[])
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

  const filtered = scans.filter(s => {
    if (filter === 'all') return true
    if (filter === 'issues') return s.status === 'fail'
    if (filter === 'clear') return s.status === 'pass'
    if (filter === 'pending') return s.status === 'uncertain'
    return true
  })

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'issues', label: 'Issues' },
    { id: 'clear', label: 'Clear' },
    { id: 'pending', label: 'Pending' },
  ]

  return (
    <div className="page-fade-in" style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--ff-sans)', willChange: 'opacity' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <AppHeader />
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '0 18px 96px' }}>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, padding: 4, borderRadius: 999, background: 'var(--card-2)', margin: '4px 0 12px' }}>
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              style={{ flex: 1, textAlign: 'center', padding: '8px 0', fontSize: 12.5, fontWeight: 500, borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'var(--ff-sans)', transition: 'all 0.15s', background: filter === f.id ? 'var(--amber)' : 'transparent', color: filter === f.id ? '#fff' : 'var(--text-mut)' }}>
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-mut)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📷</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>No scans{filter !== 'all' ? ` matching "${filter}"` : ' yet'}</div>
            <div style={{ fontSize: 13 }}>Tap + to run a compliance scan</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(scan => {
              const photoUrl = scan.photo_urls?.[0] || scan.photo_url
              const siteName = sites.find(s => s.id === scan.site_id)?.name
              const d = new Date(scan.created_at)
              const meta = [
                siteName?.toUpperCase(),
                d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }).toUpperCase(),
                d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase().replace(' ', ''),
              ].filter(Boolean).join(' · ')
              const issueCount = (scan.findings || []).filter((f: any) => f.type === 'critical').length
              return (
                <div key={scan.id} onClick={() => router.push(`/scan/${scan.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16, background: 'var(--card)', boxShadow: 'var(--shadow-card)', cursor: 'pointer' }}>
                  <Thumb url={photoUrl}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{scan.work_type || 'Unnamed scan'}</div>
                    <div style={{ marginTop: 2, fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '0.06em', color: 'var(--text-mut)', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta}</div>
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
