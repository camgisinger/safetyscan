'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Scan } from '../../lib/supabase'
import AppHeader from '../../components/AppHeader'

type Filter = 'all' | 'issues' | 'clear' | 'pending'

function statusBar(s: string)   { return s === 'pass' ? '#3E8E5A' : s === 'fail' ? '#D63A26' : 'var(--amber)' }
function statusColor(s: string) { return s === 'pass' ? 'var(--clear-tx)' : s === 'fail' ? 'var(--issue-tx-theme)' : 'var(--amber)' }
function statusLabel(s: string, n?: number) {
  if (s === 'pass') return 'Compliant'
  if (s === 'fail') return n ? `${n} issue${n !== 1 ? 's' : ''}` : 'Issues'
  return 'Pending'
}

function Thumb({ url }: { url?: string | null }) {
  if (url) return <img src={url} alt="" style={{ width: 46, alignSelf: 'stretch', objectFit: 'cover', display: 'block', borderRight: '1.5px solid var(--line)', flexShrink: 0 }}/>
  return <div style={{ width: 46, alignSelf: 'stretch', borderRight: '1.5px solid var(--line)', flexShrink: 0, backgroundColor: 'var(--surf)', backgroundImage: 'repeating-linear-gradient(135deg, var(--div) 0 1.5px, transparent 1.5px 8px)', backgroundSize: '8px 8px' }} />
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
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 32, height: 32, border: '2px solid var(--line)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
    </div>
  )

  const filtered = scans.filter(s => {
    if (filter === 'all') return true
    if (filter === 'issues') return s.status === 'fail'
    if (filter === 'clear')  return s.status === 'pass'
    return s.status === 'uncertain'
  })

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' }, { id: 'issues', label: 'Issues' }, { id: 'clear', label: 'Clear' }, { id: 'pending', label: 'Pending' },
  ]

  return (
    <div className="page-fade-in" style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 96 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <AppHeader />
      <div style={{ padding: '0 18px' }}>
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, paddingTop: 4, marginBottom: 14 }}>
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              style={{ flex: 1, textAlign: 'center', padding: '9px 0', fontWeight: 600, fontSize: 12, letterSpacing: '0.02em', borderRadius: 6, border: '1.5px solid var(--line)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', background: filter === f.id ? 'var(--amber)' : 'var(--surf)', color: filter === f.id ? '#1B1A12' : 'var(--mut)' }}>
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--mut)', fontSize: 13, fontWeight: 500 }}>
            No scans{filter !== 'all' ? ` matching "${filter}"` : ' yet'}
          </div>
        ) : filtered.map(scan => {
          const photoUrl = scan.photo_urls?.[0] || scan.photo_url
          const siteName = sites.find(s => s.id === scan.site_id)?.name
          const issueCount = (scan.findings || []).filter((f: any) => f.type === 'critical').length
          const d = new Date(scan.created_at)
          const meta = [siteName?.toUpperCase(), d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }).toUpperCase(), d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase().replace(' ', '')].filter(Boolean).join(' · ')
          return (
            <div key={scan.id} onClick={() => router.push(`/scan/${scan.id}`)}
              style={{ display: 'flex', alignItems: 'stretch', background: 'var(--surf)', border: '1.5px solid var(--line)', borderRadius: 4, overflow: 'hidden', cursor: 'pointer', marginBottom: 8 }}>
              <div style={{ width: 5, flexShrink: 0, background: statusBar(scan.status) }} />
              <Thumb url={photoUrl} />
              <div style={{ flex: 1, padding: '11px 13px', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.1, letterSpacing: '-0.02em', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{scan.work_type || 'Unnamed scan'}</div>
                <div style={{ fontWeight: 600, fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mut)', marginTop: 4 }}>{meta}</div>
              </div>
              <div style={{ alignSelf: 'center', paddingRight: 13, textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 12.5, color: statusColor(scan.status) }}>{statusLabel(scan.status, issueCount || undefined)}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
