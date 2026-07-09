'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Scan } from '../../lib/supabase'
import AppHeader from '../../components/AppHeader'
import { Camera, Archive, Check, Trash2, ChevronRight } from 'lucide-react'

type StatusFilter = 'all' | 'issues' | 'compliant' | 'pending'

function scanLeftColor(status: string) {
  if (status === 'pass') return 'var(--pass)'
  if (status === 'fail') return 'var(--issue)'
  return 'var(--warning)'
}

function statusPill(status: string, issueCount?: number) {
  if (status === 'pass') return { label: 'Compliant', bg: 'var(--pass-tint)', color: 'var(--pass-deep)' }
  if (status === 'fail') return { label: issueCount ? `${issueCount} issue${issueCount !== 1 ? 's' : ''}` : 'Issues', bg: 'var(--fail-tint)', color: 'var(--issue)' }
  return { label: 'Pending', bg: 'var(--warn-tint)', color: 'var(--warning)' }
}

export default function ScansPage() {
  const [scans, setScans] = useState<Scan[]>([])
  const [sites, setSites] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<StatusFilter>('all')
  const [showArchived, setShowArchived] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
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

  const counts = useMemo(() => ({
    issues: scans.filter(s => s.status === 'fail' && !(s as any).archived).length,
    compliant: scans.filter(s => s.status === 'pass' && !(s as any).archived).length,
    pending: scans.filter(s => s.status === 'uncertain' && !(s as any).archived).length,
    archived: scans.filter(s => (s as any).archived).length,
  }), [scans])

  const filtered = useMemo(() => {
    let result = scans.filter(s => {
      if (showArchived) return !!(s as any).archived
      if ((s as any).archived) return false
      if (status === 'issues') return s.status === 'fail'
      if (status === 'compliant') return s.status === 'pass'
      if (status === 'pending') return s.status === 'uncertain'
      return true
    })
    return result
  }, [scans, status, showArchived])

  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const handleBulkDelete = async () => {
    setDeleting(true)
    for (const id of Array.from(selected)) {
      const scan = scans.find(s => s.id === id)
      if (scan) {
        const urls = scan.photo_urls || (scan.photo_url ? [scan.photo_url] : [])
        for (const url of urls) {
          const path = url.split('/scan-photos/')[1]
          if (path) await supabase.storage.from('scan-photos').remove([path])
        }
      }
    }
    await supabase.from('scans').delete().in('id', Array.from(selected))
    setScans(prev => prev.filter(s => !selected.has(s.id)))
    setSelected(new Set()); setSelectMode(false); setShowDeleteConfirm(false); setDeleting(false)
  }

  const CHIPS: { key: StatusFilter | 'archived'; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: scans.filter(s => !(s as any).archived).length },
    { key: 'issues', label: 'Issues', count: counts.issues },
    { key: 'compliant', label: 'Compliant', count: counts.compliant },
    { key: 'pending', label: 'Pending', count: counts.pending },
  ]

  if (loading) return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid var(--border-card)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  return (
    <div className="page-fade-in" style={{ minHeight: '100svh', background: 'var(--bg)', paddingBottom: selectMode && selected.size > 0 ? 160 : 96 }}>
      <AppHeader title="Scans" rightContent={
        <button onClick={() => { setSelectMode(v => !v); setSelected(new Set()) }} style={{
          height: 34, padding: '0 14px', borderRadius: 'var(--r-control-sm)',
          border: '1.5px solid var(--border-card)', background: 'var(--surf)',
          color: selectMode ? 'var(--amber)' : 'var(--text-secondary)',
          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {selectMode ? 'Done' : 'Select'}
        </button>
      } />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '12px 18px 0' }}>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
          {CHIPS.map(chip => {
            const active = !showArchived && status === chip.key
            return (
              <button key={chip.key} onClick={() => { setShowArchived(false); setStatus(chip.key as StatusFilter) }} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                height: 34, padding: '0 13px', flexShrink: 0,
                borderRadius: 'var(--r-pill)',
                background: active ? 'var(--amber)' : 'var(--surf)',
                border: `1.5px solid ${active ? 'transparent' : 'var(--border-card)'}`,
                color: active ? '#1B1A12' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: active ? 700 : 500,
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}>
                {chip.label}
                {chip.count > 0 && (
                  <span style={{
                    fontSize: 10.5, fontWeight: 700,
                    background: active ? 'rgba(0,0,0,0.15)' : 'var(--surf-inset)',
                    color: active ? '#1B1A12' : 'var(--text-muted)',
                    borderRadius: 'var(--r-pill)', padding: '1px 5px',
                  }}>{chip.count}</span>
                )}
              </button>
            )
          })}
          {counts.archived > 0 && (
            <button onClick={() => { setShowArchived(true); setStatus('all') }} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              height: 34, padding: '0 13px', flexShrink: 0,
              borderRadius: 'var(--r-pill)',
              background: showArchived ? 'var(--surf-toggle)' : 'var(--surf)',
              border: `1.5px solid ${showArchived ? 'var(--border-card)' : 'var(--border-card)'}`,
              color: 'var(--text-muted)',
              fontSize: 13, fontWeight: showArchived ? 600 : 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <Archive size={12} strokeWidth={1.75} />
              Archived
              <span style={{ fontSize: 10.5, fontWeight: 700, background: 'var(--surf-inset)', color: 'var(--text-muted)', borderRadius: 'var(--r-pill)', padding: '1px 5px' }}>{counts.archived}</span>
            </button>
          )}
        </div>

        {/* Count row */}
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', paddingBottom: 10, paddingLeft: 2 }}>
          {filtered.length} scan{filtered.length !== 1 ? 's' : ''}
          {showArchived ? ' · archived' : status !== 'all' ? ' · filtered' : ''}
        </div>

        {filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 24px',
            background: 'var(--surf)', border: '1.5px solid var(--border-card)',
            borderRadius: 'var(--r-card)',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, background: 'var(--brand-tint)',
              display: 'grid', placeItems: 'center', margin: '0 auto 14px',
            }}>
              <Camera size={24} strokeWidth={1.75} color="var(--amber)" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>No scans found</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {status !== 'all' ? 'Try a different filter' : 'Tap the camera to create your first scan'}
            </div>
          </div>
        ) : filtered.map(scan => {
          const photoUrl = scan.photo_urls?.[0] || scan.photo_url
          const siteName = sites.find(s => s.id === scan.site_id)?.name
          const issueCount = (scan.findings || []).filter((f: any) => f.type === 'critical').length
          const pill = statusPill(scan.status, issueCount || undefined)
          const d = new Date(scan.created_at)
          const dateStr = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
          const timeStr = d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
          const isSelected = selected.has(scan.id)

          return (
            <div key={scan.id}
              onClick={() => selectMode ? toggleSelect(scan.id) : router.push(`/scan/${scan.id}`)}
              style={{
                display: 'flex', alignItems: 'stretch',
                background: isSelected ? 'var(--brand-tint)' : 'var(--surf)',
                border: `1.5px solid ${isSelected ? 'var(--amber)' : 'var(--border-card)'}`,
                borderRadius: 'var(--r-card)', overflow: 'hidden',
                cursor: 'pointer', marginBottom: 8,
                transition: 'border-color 0.15s, background 0.15s',
              }}>
              {selectMode ? (
                <div style={{ width: 52, flexShrink: 0, display: 'grid', placeItems: 'center' }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6,
                    border: `1.5px solid ${isSelected ? 'var(--amber)' : 'var(--border-card)'}`,
                    background: isSelected ? 'var(--amber)' : 'transparent',
                    display: 'grid', placeItems: 'center', transition: 'all 0.15s',
                  }}>
                    {isSelected && <Check size={13} strokeWidth={2.5} color="#1B1A12" />}
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ width: 4, flexShrink: 0, background: scanLeftColor(scan.status) }} />
                  {photoUrl ? (
                    <img src={photoUrl} alt="" style={{ width: 52, alignSelf: 'stretch', objectFit: 'cover', display: 'block', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 52, alignSelf: 'stretch', flexShrink: 0, background: 'var(--surf-inset)', display: 'grid', placeItems: 'center' }}>
                      <Camera size={18} strokeWidth={1.5} color="var(--text-muted)" />
                    </div>
                  )}
                </>
              )}
              <div style={{ flex: 1, padding: '11px 13px', minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14.5, lineHeight: 1.2, letterSpacing: '-0.02em', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {scan.work_type || 'Unnamed scan'}
                </div>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginTop: 3 }}>
                  {[siteName, dateStr, timeStr].filter(Boolean).join(' · ')}
                </div>
              </div>
              {!selectMode && (
                <div style={{ alignSelf: 'center', paddingRight: 13, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 9px',
                    borderRadius: 'var(--r-pill)', whiteSpace: 'nowrap',
                    background: pill.bg, color: pill.color,
                  }}>
                    {pill.label}
                  </span>
                  <ChevronRight size={14} strokeWidth={2} color="var(--text-muted)" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bulk action bar */}
      {selectMode && selected.size > 0 && (
        <div style={{
          position: 'fixed', bottom: 72, left: 0, right: 0, zIndex: 20,
          padding: '12px 18px', background: 'var(--surf)',
          borderTop: '1.5px solid var(--border-card)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
          display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <button onClick={() => setShowDeleteConfirm(true)} style={{
            flex: 1, height: 46, background: 'var(--issue)', border: 'none',
            borderRadius: 'var(--r-control)', color: '#fff',
            fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <Trash2 size={16} strokeWidth={2} />
            Delete {selected.size} scan{selected.size !== 1 ? 's' : ''}
          </button>
          <button onClick={() => { setSelectMode(false); setSelected(new Set()) }} style={{
            height: 46, padding: '0 18px',
            background: 'var(--surf)', border: '1.5px solid var(--border-card)',
            borderRadius: 'var(--r-control)', color: 'var(--text-secondary)',
            fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
          }}>
            Cancel
          </button>
        </div>
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'var(--surf)', border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-card)', padding: 24, maxWidth: 320, width: '100%' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Delete {selected.size} scan{selected.size !== 1 ? 's' : ''}?</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 20 }}>This cannot be undone. Photos will also be permanently deleted.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting} style={{ flex: 1, height: 46, background: 'var(--surf)', border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-control)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={handleBulkDelete} disabled={deleting} style={{ flex: 1, height: 46, background: 'var(--issue)', border: 'none', borderRadius: 'var(--r-control)', fontSize: 14, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', color: '#fff', opacity: deleting ? 0.6 : 1 }}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
