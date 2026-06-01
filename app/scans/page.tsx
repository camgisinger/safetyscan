'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Scan } from '../../lib/supabase'
import AppHeader from '../../components/AppHeader'

type StatusFilter = 'all' | 'issues' | 'compliant' | 'pending'

// Tick glyph for selected checkbox
function Tick() {
  return (
    <span style={{ display: 'block', width: 10, height: 6, borderLeft: '2px solid #1B1A12', borderBottom: '2px solid #1B1A12', transform: 'rotate(-45deg) translate(1px,-1px)' }}/>
  )
}

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
  const [status, setStatus]     = useState<StatusFilter>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')
  const [sortDir, setSortDir]   = useState<'newest' | 'oldest'>('newest')
  const [editMode, setEditMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
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
    let result = scans.filter(s => {
      if (status === 'issues')    return s.status === 'fail'
      if (status === 'compliant') return s.status === 'pass'
      if (status === 'pending')   return s.status === 'uncertain'
      return true
    })

    if (dateFrom) {
      const from = new Date(dateFrom)
      from.setHours(0, 0, 0, 0)
      result = result.filter(s => new Date(s.created_at) >= from)
    }
    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      result = result.filter(s => new Date(s.created_at) <= to)
    }

    if (sortDir === 'oldest') {
      result = [...result].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    }

    return result
  }, [scans, status, dateFrom, dateTo, sortDir])

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleBulkDelete = async () => {
    setDeleting(true)
    const ids = Array.from(selected)
    for (const id of ids) {
      const scan = scans.find(s => s.id === id)
      if (scan) {
        const urls = scan.photo_urls || (scan.photo_url ? [scan.photo_url] : [])
        for (const url of urls) {
          const path = url.split('/scan-photos/')[1]
          if (path) await supabase.storage.from('scan-photos').remove([path])
        }
      }
    }
    await supabase.from('scans').delete().in('id', ids)
    setScans(prev => prev.filter(s => !selected.has(s.id)))
    setSelected(new Set())
    setEditMode(false)
    setShowDeleteConfirm(false)
    setDeleting(false)
  }

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
        <style>{`input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(0.6);cursor:pointer}`}</style>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {/* Row 1: status + sort */}
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={status} onChange={e => setStatus(e.target.value as StatusFilter)} style={selectStyle}>
              <option value="all">All scans</option>
              <option value="issues">Issues ({activeCount.issues})</option>
              <option value="compliant">Compliant ({activeCount.compliant})</option>
              <option value="pending">Pending ({activeCount.pending})</option>
            </select>
            <select value={sortDir} onChange={e => setSortDir(e.target.value as 'newest' | 'oldest')} style={{ ...selectStyle, flex: '0 0 auto', width: 140 }}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
          {/* Row 2: date range */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--mut)', marginBottom: 4 }}>From</div>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                style={{ ...selectStyle, flex: 1, width: '100%', backgroundImage: 'none', paddingRight: 10, color: dateFrom ? 'var(--text)' : 'var(--mut)' }}/>
            </div>
            <div style={{ width: 10, height: 1.5, background: 'var(--line)', flexShrink: 0, marginTop: 18 }}/>
            <div style={{ position: 'relative', flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--mut)', marginBottom: 4 }}>To</div>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                style={{ ...selectStyle, flex: 1, width: '100%', backgroundImage: 'none', paddingRight: 10, color: dateTo ? 'var(--text)' : 'var(--mut)' }}/>
            </div>
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(''); setDateTo('') }}
                style={{ marginTop: 18, height: 38, padding: '0 10px', border: '1.5px solid var(--line)', borderRadius: 4, background: 'var(--surf)', color: 'var(--mut)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Results count + Edit toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10 }}>
          <div style={{ fontWeight: 600, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--mut)', paddingLeft: 2 }}>
            {filtered.length} scan{filtered.length !== 1 ? 's' : ''}{(status !== 'all' || dateFrom || dateTo) ? ' · filtered' : ''}
          </div>
          <button
            onClick={() => { setEditMode(v => !v); setSelected(new Set()) }}
            style={{ fontWeight: 600, fontSize: 12, letterSpacing: '0.04em', color: editMode ? 'var(--amber)' : 'var(--mut)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '0 2px' }}>
            {editMode ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--mut)', fontSize: 13, fontWeight: 500 }}>
            No scans match these filters
          </div>
        ) : filtered.map(scan => {
          const photoUrl  = scan.photo_urls?.[0] || scan.photo_url
          const siteName  = sites.find(s => s.id === scan.site_id)?.name
          const issueCount = (scan.findings || []).filter((f: any) => f.type === 'critical').length
          const d    = new Date(scan.created_at)
          const meta = [siteName?.toUpperCase(), d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }).toUpperCase(), d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase().replace(' ', '')].filter(Boolean).join(' · ')
          const isSelected = selected.has(scan.id)
          return (
            <div key={scan.id}
              onClick={() => editMode ? toggleSelect(scan.id) : router.push(`/scan/${scan.id}`)}
              style={{ display: 'flex', alignItems: 'stretch', background: isSelected ? 'rgba(238,128,26,0.08)' : 'var(--surf)', border: `1.5px solid ${isSelected ? 'var(--amber)' : 'var(--line)'}`, borderRadius: 4, overflow: 'hidden', cursor: 'pointer', marginBottom: 8, transition: 'border-color 0.15s, background 0.15s' }}>
              {editMode ? (
                <div style={{ width: 46, flexShrink: 0, display: 'grid', placeItems: 'center', borderRight: '1.5px solid var(--line)' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 4, border: `1.5px solid ${isSelected ? 'var(--amber)' : 'var(--line)'}`, background: isSelected ? 'var(--amber)' : 'transparent', display: 'grid', placeItems: 'center', transition: 'all 0.15s' }}>
                    {isSelected && <Tick />}
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ width: 5, flexShrink: 0, background: statusBarColor(scan.status) }} />
                  <Thumb url={photoUrl} />
                </>
              )}
              <div style={{ flex: 1, padding: '11px 13px', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.1, letterSpacing: '-0.02em', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{scan.work_type || 'Unnamed scan'}</div>
                <div style={{ fontWeight: 600, fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mut)', marginTop: 4 }}>{meta}</div>
              </div>
              {!editMode && (
                <div style={{ alignSelf: 'center', paddingRight: 13, flexShrink: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 12.5, color: statusTextColor(scan.status) }}>{statusLabel(scan.status, issueCount || undefined)}</div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bulk delete bar — sits above the 76px bottom nav */}
      {editMode && selected.size > 0 && (
        <div style={{ position: 'fixed', bottom: 76, left: 0, right: 0, zIndex: 20, padding: '10px 18px', background: 'var(--surf)', borderTop: '1.5px solid var(--line)', borderBottom: '1.5px solid var(--line)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => setShowDeleteConfirm(true)}
            style={{ flex: 1, height: 46, background: '#D63A26', border: '1.5px solid var(--issue)', borderRadius: 6, color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Delete {selected.size} scan{selected.size !== 1 ? 's' : ''}
          </button>
          <button onClick={() => { setEditMode(false); setSelected(new Set()) }}
            style={{ height: 46, padding: '0 18px', background: 'transparent', border: '1.5px solid var(--line)', borderRadius: 6, color: 'var(--mut)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
            Cancel
          </button>
        </div>
      )}

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'var(--surf)', border: '1.5px solid var(--line)', borderRadius: 4, padding: 24, maxWidth: 320, width: '100%' }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Delete {selected.size} scan{selected.size !== 1 ? 's' : ''}?</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--mut)', lineHeight: 1.5, marginBottom: 20 }}>This cannot be undone. Photos will also be permanently deleted.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting}
                style={{ flex: 1, height: 46, background: 'var(--surf)', border: '1.5px solid var(--line)', borderRadius: 6, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--mut)' }}>Cancel</button>
              <button onClick={handleBulkDelete} disabled={deleting}
                style={{ flex: 1, height: 46, background: '#D63A26', border: '1.5px solid var(--issue)', borderRadius: 6, fontSize: 13.5, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', color: '#fff', opacity: deleting ? 0.6 : 1 }}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
