'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Scan } from '../../lib/supabase'
import AppHeader from '../../components/AppHeader'

type StatusFilter = 'all' | 'issues' | 'compliant' | 'pending'
type DateFilter   = 'newest' | 'oldest' | 'today' | 'this_week' | 'this_month'

function statusBarColor(s: string) { return s === 'pass' ? '#3E8E5A' : s === 'fail' ? '#D63A26' : 'var(--amber)' }
function statusTextColor(s: string) { return s === 'pass' ? 'var(--clear-tx)' : s === 'fail' ? 'var(--issue-tx-theme)' : 'var(--amber)' }
function statusLabel(s: string, n?: number) {
  if (s === 'pass') return 'Compliant'
  if (s === 'fail') return n ? `${n} issue${n !== 1 ? 's' : ''}` : 'Issues'
  return 'Pending'
}

function Thumb({ url }: { url?: string | null }) {
  if (url) return <img src={url} alt="" style={{ width: 46, alignSelf: 'stretch', objectFit: 'cover', display: 'block', borderRight: '1.5px solid var(--line)', flexShrink: 0 }}/>
  return <div style={{ width: 46, alignSelf: 'stretch', borderRight: '1.5px solid var(--line)', flexShrink: 0, backgroundColor: 'var(--surf)', backgroundImage: 'repeating-linear-gradient(135deg, var(--div) 0 1.5px, transparent 1.5px 8px)', backgroundSize: '8px 8px' }} />
}

const selectStyle: React.CSSProperties = {
  flex: 1,
  height: 38,
  padding: '0 10px',
  border: '1.5px solid var(--line)',
  borderRadius: 4,
  background: 'var(--surf)',
  color: 'var(--text)',
  fontSize: 12.5,
  fontWeight: 600,
  fontFamily: 'inherit',
  cursor: 'pointer',
  appearance: 'none',
  WebkitAppearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23948E80' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
  paddingRight: 28,
}

export default function ScansPage() {
  const [scans, setScans]   = useState<Scan[]>([])
  const [sites, setSites]   = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<StatusFilter>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('newest')
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

  const filtered = useMemo(() => {
    const now = new Date()

    // Status filter
    let result = scans.filter(s => {
      if (status === 'issues')    return s.status === 'fail'
      if (status === 'compliant') return s.status === 'pass'
      if (status === 'pending')   return s.status === 'uncertain'
      return true
    })

    // Date filter (before sorting)
    if (dateFilter === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      result = result.filter(s => new Date(s.created_at) >= start)
    } else if (dateFilter === 'this_week') {
      const day = now.getDay()
      const start = new Date(now)
      start.setDate(now.getDate() - day)
      start.setHours(0, 0, 0, 0)
      result = result.filter(s => new Date(s.created_at) >= start)
    } else if (dateFilter === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      result = result.filter(s => new Date(s.created_at) >= start)
    }

    // Sort
    if (dateFilter === 'oldest') {
      result = [...result].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    }

    return result
  }, [scans, status, dateFilter])

  const activeCount = {
    issues:    scans.filter(s => s.status === 'fail').length,
    compliant: scans.filter(s => s.status === 'pass').length,
    pending:   scans.filter(s => s.status === 'uncertain').length,
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 32, height: 32, border: '2px solid var(--line)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
    </div>
  )

  return (
    <div className="page-fade-in" style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 96 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} select{outline:none}`}</style>
      <AppHeader />
      <div style={{ padding: '0 18px' }}>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {/* Status filter */}
          <div style={{ position: 'relative', flex: 1 }}>
            <select value={status} onChange={e => setStatus(e.target.value as StatusFilter)} style={selectStyle}>
              <option value="all">All scans</option>
              <option value="issues">Issues ({activeCount.issues})</option>
              <option value="compliant">Compliant ({activeCount.compliant})</option>
              <option value="pending">Pending ({activeCount.pending})</option>
            </select>
          </div>
          {/* Date filter */}
          <div style={{ position: 'relative', flex: 1 }}>
            <select value={dateFilter} onChange={e => setDateFilter(e.target.value as DateFilter)} style={selectStyle}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="today">Today</option>
              <option value="this_week">This week</option>
              <option value="this_month">This month</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div style={{ fontWeight: 600, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--mut)', paddingBottom: 10, paddingLeft: 2 }}>
          {filtered.length} scan{filtered.length !== 1 ? 's' : ''}
          {status !== 'all' || dateFilter !== 'newest' ? ' · filtered' : ''}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--mut)', fontSize: 13, fontWeight: 500 }}>
            No scans match these filters
          </div>
        ) : filtered.map(scan => {
          const photoUrl = scan.photo_urls?.[0] || scan.photo_url
          const siteName = sites.find(s => s.id === scan.site_id)?.name
          const issueCount = (scan.findings || []).filter((f: any) => f.type === 'critical').length
          const d = new Date(scan.created_at)
          const meta = [
            siteName?.toUpperCase(),
            d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }).toUpperCase(),
            d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase().replace(' ', ''),
          ].filter(Boolean).join(' · ')
          return (
            <div key={scan.id} onClick={() => router.push(`/scan/${scan.id}`)}
              style={{ display: 'flex', alignItems: 'stretch', background: 'var(--surf)', border: '1.5px solid var(--line)', borderRadius: 4, overflow: 'hidden', cursor: 'pointer', marginBottom: 8 }}>
              <div style={{ width: 5, flexShrink: 0, background: statusBarColor(scan.status) }} />
              <Thumb url={photoUrl} />
              <div style={{ flex: 1, padding: '11px 13px', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.1, letterSpacing: '-0.02em', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{scan.work_type || 'Unnamed scan'}</div>
                <div style={{ fontWeight: 600, fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mut)', marginTop: 4 }}>{meta}</div>
              </div>
              <div style={{ alignSelf: 'center', paddingRight: 13, textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 12.5, color: statusTextColor(scan.status) }}>
                  {statusLabel(scan.status, issueCount || undefined)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
